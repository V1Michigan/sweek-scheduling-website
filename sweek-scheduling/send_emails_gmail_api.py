#!/usr/bin/env python3
"""
Email sending script for Startup Week student matches using Gmail API.
Reads from Supabase database and sends personalized emails to all students.
Uses Google OAuth 2.0 for authentication.
"""

import os
import sys
import base64
import json
import time
import random
from datetime import datetime
from typing import List, Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")

# Gmail API configuration
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'
FROM_EMAIL = os.getenv("FROM_EMAIL")
FROM_NAME = os.getenv("FROM_NAME", "V1 @ Michigan")

# Rate limiting configuration
EMAIL_DELAY_MIN = float(os.getenv("EMAIL_DELAY_MIN", "0.5"))  # Gmail API is faster
EMAIL_DELAY_MAX = float(os.getenv("EMAIL_DELAY_MAX", "1.5"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "100"))  # Gmail API allows more
BATCH_DELAY = int(os.getenv("BATCH_DELAY", "30"))  # Shorter delays
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# Logging
LOG_FILE = f"email_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

# Email template
EMAIL_TEMPLATE = """Hey {name},

Congrats on getting into Startup Week! 🎉

Click the link below to see who your matches are:
{magic_link}

Please do not share this link with anyone or our matches will be invalidated.

Also feel free to email us if you have any questions.

Good luck!

Best,
The V1 Team
"""

def log_email_attempt(email: str, name: str, success: bool, error: str = None) -> None:
    """Log email attempt to JSON file."""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "email": email,
        "name": name,
        "success": success,
        "error": error
    }
    
    try:
        # Read existing log or create new
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
        
        logs.append(log_entry)
        
        # Write back to file
        with open(LOG_FILE, 'w') as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not write to log file: {e}")

def get_supabase_client() -> Client:
    """Create and return Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Missing required Supabase environment variables")
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_all_students() -> List[Dict]:
    """Fetch all active students from the database."""
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("sweek_students").select("*").eq("is_active", True).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching students: {e}")
        return []

def create_email_content(name: str, token: str) -> str:
    """Create personalized email content."""
    magic_link = f"{APP_BASE_URL}/s/{token}"
    return EMAIL_TEMPLATE.format(name=name, magic_link=magic_link)

def authenticate_gmail() -> Optional[object]:
    """Authenticate with Gmail API using OAuth 2.0."""
    creds = None
    
    # Check if token file exists
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print(f"❌ Error: {CREDENTIALS_FILE} not found!")
                print("Please download your OAuth 2.0 credentials from Google Cloud Console:")
                print("1. Go to https://console.cloud.google.com/")
                print("2. Select your project (or create one)")
                print("3. Enable Gmail API")
                print("4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID")
                print("5. Application type: Desktop application")
                print("6. Download the JSON file and save as 'credentials.json'")
                return None
            
            print("🔐 Starting OAuth authentication...")
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        print("✅ Authentication successful!")
    
    return creds

def create_message(to_email: str, to_name: str, token: str) -> Dict:
    """Create a message for an email."""
    body = create_email_content(to_name, token)
    
    message = f"""From: {FROM_NAME} <{FROM_EMAIL}>
To: {to_email}
Subject: 🎉 Your Startup Week Company Matches Are Ready!

{body}"""
    
    # Encode the message
    raw_message = base64.urlsafe_b64encode(message.encode('utf-8')).decode('utf-8')
    
    return {
        'raw': raw_message
    }

def send_email(service: object, to_email: str, to_name: str, token: str) -> bool:
    """Send email using Gmail API with retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            message = create_message(to_email, to_name, token)
            
            # Send the message
            sent_message = service.users().messages().send(
                userId='me',
                body=message
            ).execute()
            
            # Log successful send
            log_email_attempt(to_email, to_name, True)
            return True
            
        except HttpError as error:
            error_msg = f"Gmail API error (attempt {attempt + 1}/{MAX_RETRIES}): {error}"
            print(f"⚠️  {error_msg}")
            
            if attempt < MAX_RETRIES - 1:
                # Wait before retry with exponential backoff
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                print(f"⏳ Retrying in {wait_time:.1f} seconds...")
                time.sleep(wait_time)
            else:
                log_email_attempt(to_email, to_name, False, error_msg)
                return False
                
        except Exception as e:
            error_msg = f"Unexpected error (attempt {attempt + 1}/{MAX_RETRIES}): {e}"
            print(f"❌ {error_msg}")
            
            if attempt < MAX_RETRIES - 1:
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                print(f"⏳ Retrying in {wait_time:.1f} seconds...")
                time.sleep(wait_time)
            else:
                log_email_attempt(to_email, to_name, False, error_msg)
                return False
    
    return False

def send_all_emails() -> None:
    """Send emails to all students using Gmail API."""
    print("🚀 Starting email sending process with Gmail API...")
    print(f"📝 Logging to: {LOG_FILE}")
    print(f"⚙️  Rate limiting: {EMAIL_DELAY_MIN}-{EMAIL_DELAY_MAX}s between emails")
    print(f"📦 Batch size: {BATCH_SIZE} emails per batch")
    print(f"⏱️  Batch delay: {BATCH_DELAY}s between batches")
    print(f"🔄 Max retries: {MAX_RETRIES} per email")
    
    # Authenticate with Gmail
    creds = authenticate_gmail()
    if not creds:
        print("❌ Failed to authenticate with Gmail API")
        return
    
    # Build the Gmail service
    try:
        service = build('gmail', 'v1', credentials=creds)
        print("✅ Gmail API service initialized")
    except Exception as e:
        print(f"❌ Failed to build Gmail service: {e}")
        return
    
    # Get all students
    students = get_all_students()
    
    if not students:
        print("❌ No students found in database")
        return
    
    print(f"📧 Found {len(students)} students to email")
    
    # Track results
    successful = 0
    failed = 0
    failed_emails = []
    
    # Process in batches
    total_batches = (len(students) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(students))
        batch_students = students[start_idx:end_idx]
        
        print(f"\n📦 Processing batch {batch_num + 1}/{total_batches} ({len(batch_students)} emails)")
        print("-" * 60)
        
        # Send emails in current batch
        for i, student in enumerate(batch_students, 1):
            global_index = start_idx + i
            email = student.get('email')
            name = student.get('name', 'Student')
            token = student.get('token')
            
            if not email or not token:
                print(f"⚠️  Skipping student {global_index}: missing email or token")
                failed += 1
                failed_emails.append(f"{name} ({email}) - missing data")
                log_email_attempt(email or "unknown", name, False, "Missing email or token")
                continue
            
            print(f"📤 [{global_index}/{len(students)}] Sending to {name} ({email})...")
            
            if send_email(service, email, name, token):
                successful += 1
                print(f"✅ Email sent successfully to {name}")
            else:
                failed += 1
                failed_emails.append(f"{name} ({email}) - send failed")
                print(f"❌ Failed to send email to {name}")
            
            # Random delay between emails
            if global_index < len(students):  # Don't delay after the last email
                delay = random.uniform(EMAIL_DELAY_MIN, EMAIL_DELAY_MAX)
                print(f"⏳ Waiting {delay:.1f}s before next email...")
                time.sleep(delay)
        
        # Delay between batches (except after the last batch)
        if batch_num < total_batches - 1:
            print(f"\n⏸️  Batch {batch_num + 1} complete. Waiting {BATCH_DELAY}s before next batch...")
            time.sleep(BATCH_DELAY)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 EMAIL SENDING SUMMARY")
    print("="*60)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📧 Total: {len(students)}")
    print(f"📝 Log file: {LOG_FILE}")
    
    if failed_emails:
        print("\n❌ Failed emails:")
        for failed_email in failed_emails:
            print(f"  - {failed_email}")
    
    print("\n🎉 Email sending process completed!")
    print(f"💡 Check {LOG_FILE} for detailed logs")

def main():
    """Main function."""
    print("🎯 Startup Week Email Sender (Gmail API)")
    print("="*50)
    
    # Check environment variables
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY", 
        "FROM_EMAIL"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("\nPlease set these in your .env.local file:")
        for var in missing_vars:
            print(f"  {var}=your_value_here")
        sys.exit(1)
    
    # Confirm before sending
    print("⚠️  This will send emails to ALL active students in the database.")
    response = input("Are you sure you want to continue? (yes/no): ").lower().strip()
    
    if response not in ['yes', 'y']:
        print("❌ Email sending cancelled.")
        sys.exit(0)
    
    # Send emails
    send_all_emails()

if __name__ == "__main__":
    main()
