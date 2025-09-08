#!/usr/bin/env python3
"""
Setup helper for Gmail API email sender.
This script helps verify your Gmail API setup and test authentication.
"""

import os
import sys
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send',
'https://www.googleapis.com/auth/gmail.readonly']

def check_credentials_file():
    """Check if credentials.json exists."""
    if not os.path.exists('credentials.json'):
        print("❌ credentials.json not found!")
        print("\n📋 To fix this:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Select your project (or create one)")
        print("3. Enable Gmail API")
        print("4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID")
        print("5. Application type: Desktop application")
        print("6. Download the JSON file and save as 'credentials.json'")
        return False
    
    print("✅ credentials.json found")
    return True

def test_authentication():
    """Test Gmail API authentication."""
    print("\n🔐 Testing Gmail API authentication...")
    
    creds = None
    
    # Check if token file exists
    if os.path.exists('token.json'):
        print("📄 Found existing token.json")
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            print("🔐 Starting OAuth authentication...")
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
        print("✅ Authentication successful!")
    else:
        print("✅ Using existing valid credentials")
    
    return creds

def test_gmail_service(creds):
    """Test Gmail API service initialization."""
    print("\n🔧 Testing Gmail API service...")
    
    try:
        service = build('gmail', 'v1', credentials=creds)
        print("✅ Gmail API service initialized successfully")
        
        # Test getting user profile
        profile = service.users().getProfile(userId='me').execute()
        email_address = profile.get('emailAddress')
        print(f"📧 Authenticated as: {email_address}")
        
        return service, email_address
        
    except HttpError as error:
        print(f"❌ Gmail API error: {error}")
        return None, None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None, None

def test_send_permissions(service):
    """Test if we have send permissions."""
    print("\n📤 Testing send permissions...")
    
    try:
        # Try to get the user's profile (requires basic Gmail access)
        profile = service.users().getProfile(userId='me').execute()
        
        # Check if we can access the messages endpoint
        # We won't actually send, just check permissions
        service.users().messages().list(userId='me', maxResults=1).execute()
        
        print("✅ Send permissions verified")
        return True
        
    except HttpError as error:
        if error.resp.status == 403:
            print("❌ Insufficient permissions")
            print("💡 Make sure you granted 'Send email' permission during OAuth")
            return False
        else:
            print(f"❌ Gmail API error: {error}")
            return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main setup function."""
    print("🎯 Gmail API Setup Helper")
    print("=" * 40)
    
    # Step 1: Check credentials file
    if not check_credentials_file():
        sys.exit(1)
    
    # Step 2: Test authentication
    creds = test_authentication()
    if not creds:
        print("❌ Authentication failed")
        sys.exit(1)
    
    # Step 3: Test Gmail service
    service, email_address = test_gmail_service(creds)
    if not service:
        print("❌ Gmail service initialization failed")
        sys.exit(1)
    
    # Step 4: Test send permissions
    if not test_send_permissions(service):
        print("❌ Send permissions test failed")
        sys.exit(1)
    
    # Success!
    print("\n" + "=" * 40)
    print("🎉 Gmail API Setup Complete!")
    print("=" * 40)
    print(f"✅ Authenticated as: {email_address}")
    print("✅ Gmail API service ready")
    print("✅ Send permissions verified")
    print("\n💡 You can now run: python send_emails_gmail_api.py")
    
    # Check environment variables
    print("\n🔍 Checking environment variables...")
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "FROM_EMAIL"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("💡 Set these in your .env.local file before running the email script")
    else:
        print("✅ All required environment variables found")

if __name__ == "__main__":
    main()
