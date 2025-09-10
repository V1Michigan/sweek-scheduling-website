#!/usr/bin/env python3
"""
Supabase Sync Script for Sweek Scheduling

Usage: python sync_script.py company.csv student_matches.csv

CSV Formats:
- Long form: email,name,company,tier,stage
- Wide form: email,name,companies (semicolon-separated),tier_top10 (semicolon-separated)
"""

import csv
import hashlib
import secrets
import sys
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from supabase import create_client, Client
import argparse

# Configuration
APP_BASE_URL = os.getenv('APP_BASE_URL', 'http://localhost:3000')

@dataclass
class Company:
    name: str
    blurb: Optional[str] = None
    learn_more_url: Optional[str] = None
    logo_slug: Optional[str] = None
    scheduling_url: Optional[str] = None
    website_url: Optional[str] = None

@dataclass
class Student:
    email: str
    name: str
    token: str
    token_hash: str

@dataclass
class Match:
    student_email: str
    student_name: str
    company_name: str
    tier: str
    stage: str

def generate_token() -> str:
    """Generate a random token for student authentication."""
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    """Hash token with SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()

def detect_csv_format(file_path: str) -> str:
    """Detect if CSV is in long or wide format."""
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        if 'company' in header and 'tier' in header and 'stage' in header:
            return 'long'
        elif 'companies' in header:
            return 'wide'
        else:
            raise ValueError(f"Unknown CSV format. Header: {header}")

def parse_long_format(file_path: str) -> List[Match]:
    """Parse long format CSV: email,name,company,tier,stage"""
    matches = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            matches.append(Match(
                student_email=row['email'].strip(),
                student_name=row['name'].strip(),
                company_name=row['company'].strip(),
                tier=row['tier'].strip(),
                stage=row['stage'].strip()
            ))
    return matches

def parse_wide_format(file_path: str) -> List[Match]:
    """Parse wide format CSV: email,name,companies (all companies are Top 10)"""
    matches = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row['email'].strip()
            name = row['name'].strip()
            
            companies = [c.strip() for c in row['companies'].split(';') if c.strip()]
            
            for company in companies:
                # All companies in this CSV are Top 10 matches
                matches.append(Match(
                    student_email=email,
                    student_name=name,
                    company_name=company,
                    tier="Top 10",  # All matches are Top 10
                    stage='assigned'  # Default stage
                ))
    return matches

def parse_companies_csv(file_path: str) -> Dict[str, Company]:
    """Parse companies CSV and return dict of company_name -> Company."""
    companies = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['name'].strip()
            companies[name] = Company(
                name=name,
                blurb=row.get('blurb', '').strip() or None,
                learn_more_url=row.get('learn_more_url', '').strip() or None,
                logo_slug=row.get('logo_slug', '').strip() or None,
                scheduling_url=row.get('scheduling_url', '').strip() or None,
                website_url=row.get('website_url', '').strip() or None
            )
    return companies

def upsert_companies(supabase: Client, companies: Dict[str, Company]) -> None:
    """Upsert companies to Supabase."""
    print(f"Upserting {len(companies)} companies...")
    
    for company in companies.values():
        company_data = {
            'name': company.name,
            'blurb': company.blurb,
            'learn_more_url': company.learn_more_url,
            'logo_slug': company.logo_slug,
            'scheduling_url': company.scheduling_url or f"https://calendly.com/{company.name.lower().replace(' ', '-')}",
            'website_url': company.website_url,
            'is_active': True
        }
        
        # Remove None values
        company_data = {k: v for k, v in company_data.items() if v is not None}
        
        try:
            supabase.table('sweek_companies').upsert(company_data, on_conflict='name').execute()
            print(f"  ✓ {company.name}")
        except Exception as e:
            print(f"  ✗ Error upserting {company.name}: {e}")

def upsert_students(supabase: Client, matches: List[Match]) -> Dict[str, Student]:
    """Upsert students and return dict of email -> Student."""
    print("Upserting students...")
    
    # Get unique students from matches
    student_emails = list(set(match.student_email for match in matches))
    students = {}
    
    for email in student_emails:
        # Get student name from first match
        student_name = next((match.student_name for match in matches if match.student_email == email), email.split('@')[0].replace('.', ' ').title())
        
        # Try to find existing student
        existing = supabase.table('sweek_students').select('*').eq('email', email).execute()
        
        if existing.data:
            # Student exists, update name and use existing token
            student_data = existing.data[0]
            
            # Update the name if it's different
            if student_data['name'] != student_name:
                supabase.table('sweek_students').update({'name': student_name}).eq('email', email).execute()
                print(f"  ✓ {email} (updated name: {student_name})")
            else:
                print(f"  ✓ {email} (existing)")
                
            students[email] = Student(
                email=email,
                name=student_name,  # Use the name from CSV
                token=student_data['token'],
                token_hash=student_data['token_hash']
            )
        else:
            # New student, generate token
            token = generate_token()
            token_hash = hash_token(token)
            
            student_data = {
                'email': email,
                'name': student_name,
                'token': token,
                'token_hash': token_hash,
                'is_active': True
            }
            
            try:
                result = supabase.table('sweek_students').insert(student_data).execute()
                students[email] = Student(
                    email=email,
                    name=student_name,
                    token=token,
                    token_hash=token_hash
                )
                print(f"  ✓ {email} (new)")
            except Exception as e:
                print(f"  ✗ Error creating student {email}: {e}")
    
    return students

def replace_student_matches(supabase: Client, matches: List[Match], students: Dict[str, Student]) -> None:
    """Replace all matches for each student with new matches from CSV."""
    print("Replacing student matches...")
    
    # Group matches by student
    student_matches = {}
    for match in matches:
        if match.student_email not in student_matches:
            student_matches[match.student_email] = []
        student_matches[match.student_email].append(match)
    
    for email, student_matches_list in student_matches.items():
        if email not in students:
            print(f"  ✗ Student {email} not found, skipping matches")
            continue
        
        student = students[email]
        
        # Get student UUID from database
        student_result = supabase.table('sweek_students').select('id').eq('email', email).execute()
        if not student_result.data:
            print(f"  ✗ Student {email} not found in database, skipping matches")
            continue
        
        student_id = student_result.data[0]['id']
        
        # Delete existing matches for this student
        try:
            supabase.table('sweek_matches').delete().eq('student_id', student_id).execute()
        except Exception as e:
            print(f"  ✗ Error deleting existing matches for {email}: {e}")
            continue
        
        # Insert new matches
        for match in student_matches_list:
            # Get company ID
            company_result = supabase.table('sweek_companies').select('id').eq('name', match.company_name).execute()
            if not company_result.data:
                print(f"  ✗ Company {match.company_name} not found, skipping match")
                continue
            
            company_id = company_result.data[0]['id']
            
            match_data = {
                'student_id': student_id,  # Use actual UUID
                'company_id': company_id,
                'tier': match.tier,
                'stage': 'pending'  # Default stage for new matches
            }
            
            try:
                supabase.table('sweek_matches').insert(match_data).execute()
                print(f"  ✓ {email} -> {match.company_name} ({match.tier})")
            except Exception as e:
                print(f"  ✗ Error creating match {email} -> {match.company_name}: {e}")

def print_magic_links(students: Dict[str, Student]) -> None:
    """Print magic links for new students."""
    print("\n" + "="*60)
    print("MAGIC LINKS FOR EMAILING")
    print("="*60)
    
    for email, student in students.items():
        magic_link = f"{APP_BASE_URL}/s/{student.token}"
        print(f"{email}: {magic_link}")
    
    print("="*60)

def main():
    global APP_BASE_URL
    
    parser = argparse.ArgumentParser(description='Sync companies and student matches to Supabase')
    parser.add_argument('company_csv', help='Path to companies CSV file')
    parser.add_argument('student_matches_csv', help='Path to student matches CSV file')
    parser.add_argument('--app-url', default=APP_BASE_URL, help='Base URL for magic links')
    
    args = parser.parse_args()
    
    # Set global APP_BASE_URL
    APP_BASE_URL = args.app_url
    
    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) environment variables")
        sys.exit(1)
    
    # Use service role key for admin operations (bypasses RLS)
    supabase: Client = create_client(supabase_url, supabase_key)
    
    try:
        # Parse companies CSV
        print("Parsing companies CSV...")
        companies = parse_companies_csv(args.company_csv)
        print(f"Found {len(companies)} companies")
        
        # Parse student matches CSV
        print("\nParsing student matches CSV...")
        format_type = detect_csv_format(args.student_matches_csv)
        print(f"Detected {format_type} format")
        
        if format_type == 'long':
            matches = parse_long_format(args.student_matches_csv)
        else:
            matches = parse_wide_format(args.student_matches_csv)
        
        print(f"Found {len(matches)} matches")
        
        # Upsert companies
        print("\n" + "="*60)
        upsert_companies(supabase, companies)
        
        # Upsert students
        print("\n" + "="*60)
        students = upsert_students(supabase, matches)
        
        # Replace student matches
        print("\n" + "="*60)
        replace_student_matches(supabase, matches, students)
        
        # Print magic links
        print_magic_links(students)
        
        print(f"\n✅ Sync completed successfully!")
        print(f"   - {len(companies)} companies processed")
        print(f"   - {len(students)} students processed")
        print(f"   - {len(matches)} matches processed")
        
    except Exception as e:
        print(f"❌ Error during sync: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
