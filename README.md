# 🎟️ Knolta Ticket Management System

A **premium, full-featured ticket tracking system** for dinner events with authentication, QR codes, SMS notifications, and database backend.

## ✨ Features

### Core Features
- **📊 Dashboard Overview**: Real-time statistics for Total Tickets, Sold, Revenue, and Confirmation rates
- **🎫 Ticket Management**: View, search, and filter tickets by status or type
- **➕ Add Tickets**: Easy-to-use modal for adding new attendees
- **✅ Confirm Pending Tickets**: One-click confirmation with SMS notification
- **🗑️ Delete with Confirmation**: Beautiful warning modal before deletion
- **📱 QR Code Generation**: Each ticket gets a unique QR code for easy check-in
- **📤 Enhanced CSV Export**: Download detailed reports with statistics
- **🇬🇭 Ghana Phone Format**: Supports +233 format with validation
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

### Advanced Features
- **🔐 User Authentication**: JWT-based login system
- **📧 SMS Notifications** (Optional): Twilio integration for confirmation messages
- **💾 Database Backend**: SQLite for persistent storage
- **🔒 Secure**: Password hashing with bcrypt
- **🌐 RESTful API**: Clean API architecture

## 🚀 Quick Start

### Prerequisites
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd C:\Users\LENOVO\Desktop\QUANTUM\knolta_ticket
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (Optional):
   - Open `.env` file
   - Update the following if needed:
     ```env
     # Admin Credentials (CHANGE THESE!)
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=admin123
     
     # For SMS (optional - get from https://www.twilio.com)
     TWILIO_ACCOUNT_SID=your_account_sid
     TWILIO_AUTH_TOKEN=your_auth_token
     TWILIO_PHONE_NUMBER=your_twilio_phone
     ```

4. **Start the server**:
   ```bash
   node server.js
   ```

   You should see:
   ```
   Connected to the SQLite database.
   Twilio not configured - SMS sending disabled
   Server running on http://localhost:3000
   Default login - Username: admin, Password: admin123
   ```

5. **Access the app**:
   - Open your browser and go to: **http://localhost:3000**
   - Login with:
     - **Username**: `admin`
     - **Password**: `admin123`

## 📖 Usage Guide

### Login
- Use default credentials: `admin` / `admin123`
- Change these in `.env` for security

### Managing Tickets

#### Adding a Ticket
1. Click **"+ Add Ticket"** button
2. Fill in:
   - Attendee Name
   - Phone Number (Ghana format: +233 24 XXX XXXX)
   - Ticket Type (VIP, Standard, or Early Bird)
   - Status (Confirmed or Pending)
3. Click **"Create Ticket"**
4. If status is "Confirmed" and SMS is configured, a confirmation SMS is sent automatically

#### Confirming a Pending Ticket
1. Find the ticket with "pending" status
2. Click the **green checkmark** icon
3. Status changes to "confirmed"
4. SMS notification sent automatically (if configured)

#### Viewing QR Code
1. Click the **QR code icon** next to any ticket
2. Modal shows the unique QR code
3. This can be scanned at the event for check-in

#### Deleting a Ticket
1. Click the **trash icon**
2. Confirm deletion in the warning modal
3. Ticket is permanently removed

### Search & Filter
- **Search**: Type name or phone number
- **Status Filter**: Select All, Confirmed, Pending, or Cancelled
- **Type Filter**: Select All, VIP, Standard, or Early Bird

### Export Data
- Click **"Export"** button
- Downloads a CSV file with:
  - All ticket details
  - Summary statistics
  - Filename includes current date

### Logout
- Click **"Logout"** in the header
- Returns to login page

## 📱 Setting Up SMS Notifications (Optional)

SMS notifications are sent via **Twilio** (a popular SMS service):

1. **Sign up for Twilio**:
   - Go to [https://www.twilio.com/](https://www.twilio.com/)
   - Create a free account
   - Get $15 free credit

2. **Get Credentials**:
   - From Twilio Console, copy:
     - Account SID
     - Auth Token
     - Buy a Twilio phone number

3. **Update `.env` file**:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+15551234567
   ```

4. **Restart the server**:
   ```bash
   node server.js
   ```

5. **Test**:
   - Add a ticket with status "Confirmed"
   - Or confirm a pending ticket
   - SMS should be sent automatically

### SMS Message Format
```
Hello [Name]! Your [Type] ticket for the Dinner Event has been confirmed. 
Ticket ID: [ID]. See you on [Date]!
```

## 🏗️ Project Structure

```
knolta_ticket/
├── css/
│   └── style.css              # All styling
├── js/
│   ├── app.js                 # Main application logic
│   └── data.js                # API communication layer
├── server.js                  # Backend server (Express + SQLite)
├── login.html                 # Login page
├── index.html                 # Main application
├── tickets.db                 # SQLite database (auto-created)
├── .env                       # Environment variables (IMPORTANT: Keep secret!)
├── package.json               # Node.js dependencies
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🔌 API Endpoints

All endpoints require authentication (except login).

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/check` - Verify token validity

### Tickets
- `GET /api/tickets` - Fetch all tickets
- `POST /api/tickets` - Create a new ticket
- `DELETE /api/tickets/:id` - Delete a ticket
- `PATCH /api/tickets/:id/confirm` - Confirm a ticket
- `GET /api/tickets/:id/qrcode` - Get QR code for a ticket

## ⚙️ Customization

### Change Ticket Prices
Edit `js/data.js`:
```javascript
PRICES: {
    'VIP': 250,
    'Standard': 150,
    'Early Bird': 120
}
```

### Change Total Capacity
Edit `js/app.js`:
```javascript
const TOTAL_CAPACITY = 100;
```

### Change Admin Credentials
Edit `.env`:
```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
```

## 🔒 Security Best Practices

1. **Change Default Password**: Immediately change `admin/admin123` in `.env`
2. **Keep `.env` Secret**: Never commit `.env` to version control
3. **Use HTTPS in Production**: Set `cookie: { secure: true }` in `server.js`
4. **Strong JWT Secret**: Change `JWT_SECRET` in `.env` to a long random string

## 🌐 Accessing from Other Devices

### Same Network (Local)
1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.5)

2. On other devices, navigate to:
   ```
   http://192.168.1.5:3000
   ```

### Internet (Production)
Deploy to a cloud service:
- **Heroku**: https://www.heroku.com/
- **Railway**: https://railway.app/
- **Render**: https://render.com/

## 🐛 Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Port 3000 is already in use"
Change port in `.env`:
```env
PORT=3001
```
Then update `js/data.js`:
```javascript
API_URL: 'http://localhost:3001/api',
```

### "Failed to fetch" / "Connection error"
- Ensure server is running (`node server.js`)
- Check the console for errors
- Verify the API_URL in `js/data.js` matches your server

### SMS not sending
- Verify Twilio credentials in `.env`
- Check Twilio account credits
- Ensure phone number format is correct (+233...)

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Future Enhancements

- Multi-event support
- Email notifications
- Advanced analytics with charts
- Ticket scanning app
- Payment integration
- Guest check-in system

---

**Built with ❤️ for Knolta Dinner Events**
