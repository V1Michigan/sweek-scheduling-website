# 📧 Gmail API Email Sender Setup

This guide will help you set up the Gmail API version of the email sender, which is more reliable and has better rate limits than SMTP.

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   pip install -r gmail_api_requirements.txt
   ```

2. **Set up Google Cloud Console:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Gmail API
   - Create OAuth 2.0 credentials

3. **Download credentials:**

   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: **Desktop application**
   - Download the JSON file and save as `credentials.json` in the project root

4. **Set up environment variables** in `.env.local`:

   ```bash
   # Supabase (required)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Email settings (required)
   FROM_EMAIL=your_email@gmail.com
   FROM_NAME="V1 @ Michigan"

   # Optional
   APP_BASE_URL=https://your-domain.com

   # Rate limiting (optional - Gmail API defaults)
   EMAIL_DELAY_MIN=0.5
   EMAIL_DELAY_MAX=1.5
   BATCH_SIZE=100
   BATCH_DELAY=30
   MAX_RETRIES=3
   ```

5. **Run the script:**
   ```bash
   python send_emails_gmail_api.py
   ```

## 🔧 Google Cloud Console Setup (Detailed)

### Step 1: Create/Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Startup Week Email Sender" (or similar)
4. Click "Create"

### Step 2: Enable Gmail API

1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" → "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (unless you have Google Workspace)
   - App name: "Startup Week Email Sender"
   - User support email: your email
   - Developer contact: your email
   - Add your email to test users
4. For OAuth 2.0 Client ID:
   - Application type: **Desktop application**
   - Name: "Startup Week Email Sender"
5. Click "Create"
6. Download the JSON file and save as `credentials.json`

### Step 4: First Run Authentication

1. Run the script: `python send_emails_gmail_api.py`
2. Your browser will open for OAuth authentication
3. Sign in with the Google account you want to send emails from
4. Grant permissions to the application
5. The script will save a `token.json` file for future runs

## 📧 Email Content

The script sends this exact message:

```
Hey {name},

Congrats on getting into Startup Week! 🎉

Click the link below to see who your matches are:
{magic_link}

Please do not share this link with anyone or our matches will be invalidated.

Also feel free to email us if you have any questions.

Good luck!

Best,
The V1 Team
```

## 🛡️ Gmail API Advantages

- **Higher rate limits**: 1 billion quota units per day (vs SMTP limits)
- **More reliable**: No SMTP authentication issues
- **Better error handling**: Detailed error messages
- **No app passwords needed**: Uses OAuth 2.0
- **Faster**: No connection overhead per email

## ⚙️ Rate Limiting (Gmail API)

Gmail API has much higher limits than SMTP:

- **Quota**: 1 billion quota units per day
- **Each email**: 100 quota units
- **Daily limit**: ~10 million emails (way more than you need!)
- **Rate limiting**: Built into the API, no need for aggressive delays

Our conservative settings:

- **Email delay**: 0.5-1.5 seconds (vs 1-3s for SMTP)
- **Batch size**: 100 emails (vs 50 for SMTP)
- **Batch delay**: 30 seconds (vs 60s for SMTP)

## 📊 Example Output

```
🎯 Startup Week Email Sender (Gmail API)
==================================================
⚠️  This will send emails to ALL active students in the database.
Are you sure you want to continue? (yes/no): yes

🚀 Starting email sending process with Gmail API...
📝 Logging to: email_log_20241207_143022.json
⚙️  Rate limiting: 0.5-1.5s between emails
📦 Batch size: 100 emails per batch
⏱️  Batch delay: 30s between batches
🔄 Max retries: 3 per email
🔐 Starting OAuth authentication...
✅ Authentication successful!
✅ Gmail API service initialized
📧 Found 150 students to email

📦 Processing batch 1/2 (100 emails)
------------------------------------------------------------
📤 [1/150] Sending to John Doe (john@umich.edu)...
✅ Email sent successfully to John Doe
⏳ Waiting 0.8s before next email...
📤 [2/150] Sending to Jane Smith (jane@umich.edu)...
✅ Email sent successfully to Jane Smith
⏳ Waiting 1.2s before next email...
...

⏸️  Batch 1 complete. Waiting 30s before next batch...

📦 Processing batch 2/2 (50 emails)
------------------------------------------------------------
...

============================================================
📊 EMAIL SENDING SUMMARY
============================================================
✅ Successful: 150
❌ Failed: 0
📧 Total: 150
📝 Log file: email_log_20241207_143022.json

🎉 Email sending process completed!
💡 Check email_log_20241207_143022.json for detailed logs
```

## 🔍 Troubleshooting

**"credentials.json not found"**

- Download OAuth 2.0 credentials from Google Cloud Console
- Save as `credentials.json` in the project root

**"Authentication failed"**

- Make sure you're using the correct Google account
- Check that Gmail API is enabled in your project
- Verify OAuth consent screen is configured

**"Gmail API service initialization failed"**

- Check your internet connection
- Verify the credentials are valid
- Try deleting `token.json` and re-authenticating

**"No students found"**

- Verify your Supabase connection
- Check that students exist in `sweek_students` table with `is_active = true`

## 🔄 Migration from SMTP

If you were using the SMTP version:

1. **Install new dependencies:**

   ```bash
   pip install -r gmail_api_requirements.txt
   ```

2. **Set up Gmail API** (follow steps above)

3. **Update environment variables:**

   - Remove `SMTP_*` variables
   - Keep `FROM_EMAIL` and `FROM_NAME`
   - Optionally adjust rate limiting settings

4. **Run the new script:**
   ```bash
   python send_emails_gmail_api.py
   ```

## 📁 File Structure

After setup, you should have:

```
sweek-scheduling/
├── send_emails_gmail_api.py    # Main script
├── credentials.json            # OAuth credentials (download from Google)
├── token.json                  # Auto-generated auth token
├── gmail_api_requirements.txt  # Dependencies
├── GMAIL_API_SETUP.md         # This guide
└── email_log_YYYYMMDD_HHMMSS.json  # Generated logs
```

## 🚨 Security Notes

- **Never commit `credentials.json` or `token.json`** to version control
- Add them to `.gitignore`:
  ```
  credentials.json
  token.json
  email_log_*.json
  ```
- The OAuth token is tied to your Google account - keep it secure
- You can revoke access anytime in your Google Account settings
