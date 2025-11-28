# 📱 SMS Notifications Setup Guide

This guide will help you set up SMS notifications for your ticket system using Twilio.

## What is Twilio?

Twilio is a cloud communications platform that allows you to send SMS messages programmatically. It's used by companies like Uber, Airbnb, and Netflix.

## Why SMS?

SMS notifications provide:
- ✅ **Instant confirmation** when tickets are created or confirmed
- 📱 **Direct communication** with attendees
- 🔔 **High open rates** (98% of SMS are read within 3 minutes)
- 🌍 **Works everywhere** - no internet required for recipients

## Step-by-Step Setup

### Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Click "Sign up" and fill in your details
3. Verify your email and phone number
4. You'll get **$15 free credit** to test

### Step 2: Get Your Credentials

Once logged in to the Twilio Console:

1. **Find your Account SID and Auth Token**:
   - Look at the main dashboard
   - You'll see something like:
     ```
     Account SID: ACxxxxxxxxxxxxxxxxx...
     Auth Token: [click to reveal]
     ```
   - Copy both of these

2. **Get a Phone Number**:
   - Click "Get a Trial Number" or go to Phone Numbers → Manage → Buy a number
   - Select your country (Ghana if available, or use a US number)
   - Choose a number with SMS capabilities
   - Click "Buy" (it's free with trial credit)

### Step 3: Configure Your Application

1. **Open the `.env` file** in your project folder:
   ```
   C:\Users\LENOVO\Desktop\QUANTUM\knolta_ticket\.env
   ```

2. **Update these lines** with your Twilio credentials:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here_32_characters
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Save the file**

### Step 4: Restart the Server

1. **Stop the current server**:
   - In the terminal where the server is running, press `Ctrl+C`

2. **Start it again**:
   ```bash
   node server.js
   ```

3. **You should see**:
   ```
   Twilio SMS service initialized
   Server running on http://localhost:3000
   ```

### Step 5: Test SMS

1. **Login to your app**: http://localhost:3000
2. **Add a new ticket**:
   - Name: Your Name
   - Phone: Your actual Ghana phone number (e.g., +233 24 123 4567)
   - Type: VIP
   - Status: **Confirmed** ← Important!
3. Click "Create Ticket"
4. **Check your phone** - you should receive an SMS!

## 📝 SMS Message Template

When a ticket is confirmed, the attendee receives:

```
Hello [Name]! Your [Type] ticket for the Dinner Event has been confirmed. 
Ticket ID: [123]. See you on [Date]!
```

Example:
```
Hello Sarah! Your VIP ticket for the Dinner Event has been confirmed. 
Ticket ID: 42. See you on 1/15/2025!
```

## 💰 Pricing

### Free Trial
- **$15 free credit**
- Enough for ~500-1000 SMS (depending on destination)
- Perfect for testing

### Paid Plans
After trial credit runs out:
- **US/Canada**: ~$0.0075 per SMS
- **Ghana**: ~$0.03-0.05 per SMS
- **No monthly fees** - pay only for what you use

## 🌍 International Sending

### Sending to Ghana Numbers

1. **Format**: Always use international format
   - ✅ Correct: `+233 24 123 4567`
   - ❌ Wrong: `024 123 4567`

2. **Verification** (Trial Accounts):
   - Trial accounts can only send to verified numbers
   - Go to Twilio Console → Phone Numbers → Verified Numbers
   - Add the phone numbers you want to test with

3. **Upgrade for Production**:
   - Once ready for the actual event, upgrade your account
   - This removes the verified number restriction
   - You can send to ANY phone number

## 🔧 Troubleshooting

### "SMS not configured" in console

**Problem**: Server shows "Twilio not configured"

**Solution**:
1. Check `.env` file has all three values filled
2. Ensure no extra spaces in the values
3. Restart the server

### SMS not being received

**Possible causes**:

1. **Trial Account Restrictions**:
   - Verify the recipient number in Twilio Console
   - Or upgrade your account

2. **Wrong Phone Format**:
   - Must include country code: `+233...`
   - Use spaces: `+233 24 123 4567`

3. **Insufficient Credits**:
   - Check your Twilio balance
   - Add more credits if needed

4. **Check Twilio Logs**:
   - Go to Twilio Console → Monitor → Logs → Messaging
   - See delivery status of each SMS

### Error in console

If you see errors:
1. Check your Account SID and Auth Token are correct
2. Ensure your Twilio number is SMS-enabled
3. Check your Twilio account is active

## 🎯 Best Practices

1. **Test First**: Always test with your own number before the event
2. **Monitor Usage**: Keep an eye on your Twilio credit balance
3. **Professional Tone**: The message represents your event
4. **Include Details**: Ticket ID, event date, and type
5. **Timing**: Send confirmations immediately for best experience

## 🔒 Security

- **Never share** your Auth Token
- The `.env` file is in `.gitignore` - don't commit it to Git
- If you accidentally expose your token:
  - Go to Twilio Console → Settings → API Credentials
  - Create a new Auth Token
  - Update `.env` with the new token

## 🚀 Going Live

When ready for your actual event:

1. **Upgrade Twilio Account**:
   - Remove trial restrictions
   - Can send to any number

2. **Add Credit**:
   - Estimate: 100 guests × $0.05 = $5-10 should be enough

3. **Test Everything**:
   - Send a few test SMS
   - Verify delivery
   - Check message content

4. **Monitor on Event Day**:
   - Watch Twilio logs
   - Ensure all SMS are delivered

## 📞 Support

- **Twilio Documentation**: https://www.twilio.com/docs/sms
- **Twilio Support**: https://support.twilio.com/
- **Pricing Calculator**: https://www.twilio.com/sms/pricing

---

**Need help?** Check the main README.md or contact support.
