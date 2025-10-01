# Gmail Setup for Portfolio Contact Form

## 🔐 Setting up Gmail App Password

Your contact form needs an **App Password** to send emails through Gmail (not your regular password).

### Step 1: Enable 2-Factor Authentication

1. Go to your **Google Account**: https://myaccount.google.com
2. Click **Security** on the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the steps to **enable 2-Step Verification** if not already enabled

### Step 2: Generate App Password

1. Go back to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Click **App passwords**
4. Select app: **Mail**
5. Select device: **Other (custom name)**
6. Enter name: **Portfolio Contact Form**
7. Click **Generate**
8. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File

Replace your current `.env` file with:

```env
MONGO_URI=mongodb://localhost:27017/contactFormDB
GMAIL_USER=gkmalinda@gmail.com
GMAIL_PASS=your-16-character-app-password-here
PORT=8000
```

**Important:** Remove any spaces from the app password!

### Step 4: Test the Configuration

1. Update your `.env` file with the app password
2. Restart your server
3. Submit a test message through your contact form
4. Check your Gmail inbox for the notification

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid login"** → Make sure 2FA is enabled and you're using App Password
2. **"Authentication failed"** → Double-check the app password (no spaces)
3. **"ETIMEDOUT"** → Check your internet connection and firewall settings

### Alternative Solution:

If Gmail doesn't work, you can use other email services:

**Outlook/Hotmail:**
```javascript
service: 'outlook'
```

**Yahoo:**
```javascript
service: 'yahoo'
```

**Custom SMTP:**
```javascript
host: 'smtp.yourdomain.com',
port: 587,
secure: false,
```

## 📧 Current Status

Your server will show:
- ✅ `✉️ SMTP ready - emails will be sent` (if working)
- ❌ `⚠️ SMTP verify failed` (if there's an issue)

Check the server console output for detailed error messages.