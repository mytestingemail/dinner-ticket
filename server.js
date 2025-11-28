const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Twilio Configuration (Optional - only if SMS is enabled)
let twilioClient = null;
try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require('twilio');
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('Twilio SMS service initialized');
    } else {
        console.log('Twilio not configured - SMS sending disabled');
    }
} catch (error) {
    console.log('Twilio initialization failed:', error.message);
    twilioClient = null;
}

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(bodyParser.json());
// Note: express.static moved after route definitions to prevent index.html from being served at root
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Database Setup
const db = new sqlite3.Database('./tickets.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create tickets table
        db.run(`CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            type TEXT,
            price INTEGER,
            status TEXT,
            date TEXT,
            qr_code TEXT,
            checked_in INTEGER DEFAULT 0,
            check_in_time TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating tickets table', err.message);
            }
        });

        // Create users table for authentication
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating users table', err.message);
            } else {
                // Check if admin user exists, if not create one
                db.get("SELECT * FROM users WHERE username = ?", [process.env.ADMIN_USERNAME || 'admin'], (err, row) => {
                    if (!row) {
                        const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
                        db.run("INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)",
                            [process.env.ADMIN_USERNAME || 'admin', hashedPassword, new Date().toISOString()],
                            (err) => {
                                if (err) {
                                    console.error('Error creating admin user', err.message);
                                } else {
                                    console.log('Default admin user created. Username: admin, Password: admin123');
                                }
                            }
                        );
                    }
                });
            }
        });

        // Seed initial data if needed
        db.get("SELECT count(*) as count FROM tickets", (err, row) => {
            if (row && row.count === 0) {
                console.log("Seeding database...");
                const initialTickets = [
                    { name: 'Sarah Johnson', phone: '+233 24 123 4567', type: 'VIP', price: 250, status: 'confirmed', date: '2025-01-15' },
                    { name: 'Michael Chen', phone: '+233 24 234 5678', type: 'Standard', price: 150, status: 'confirmed', date: '2025-01-16' },
                    { name: 'Emma Davis', phone: '+233 24 345 6789', type: 'Early Bird', price: 120, status: 'pending', date: '2025-01-10' },
                    { name: 'James Wilson', phone: '+233 24 456 7890', type: 'VIP', price: 250, status: 'confirmed', date: '2025-01-17' },
                    { name: 'Lisa Anderson', phone: '+233 24 567 8901', type: 'Standard', price: 150, status: 'cancelled', date: '2025-01-12' },
                    { name: 'Robert Taylor', phone: '+233 24 678 9012', type: 'Standard', price: 150, status: 'confirmed', date: '2025-01-18' },
                    { name: 'Jennifer Martin', phone: '+233 24 789 0123', type: 'Early Bird', price: 120, status: 'confirmed', date: '2025-01-09' },
                    { name: 'David White', phone: '+233 24 890 1234', type: 'VIP', price: 250, status: 'pending', date: '2025-01-19' }
                ];

                // Generate QR codes and insert tickets
                const insert = db.prepare("INSERT INTO tickets (name, phone, type, price, status, date, qr_code, checked_in) VALUES (?, ?, ?, ?, ?, ?, ?, 0)");
                initialTickets.forEach(async (t, index) => {
                    const ticketId = index + 1;
                    // Generate QR code with URL instead of JSON
                    const qrUrl = `${SERVER_URL}/checkin/${ticketId}`;
                    const qrCode = await generateQRCode(qrUrl);
                    insert.run(t.name, t.phone, t.type, t.price, t.status, t.date, qrCode);
                });
                insert.finalize();
                console.log('Database seeded with QR codes');
            }
        });
    }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};

// Helper function to send SMS
async function sendSMS(to, message) {
    if (!twilioClient) {
        console.log('SMS not configured. Would have sent:', message, 'to', to);
        return { success: false, message: 'SMS service not configured' };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('SMS send error:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to generate QR code
async function generateQRCode(data) {
    try {
        const qrCode = await QRCode.toDataURL(data);
        return qrCode;
    } catch (error) {
        console.error('QR code generation error:', error);
        return null;
    }
}

// ============ API Endpoints ============

// Authentication - Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            token: token,
            username: user.username
        });
    });
});

// Check authentication status
app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({ authenticated: true, username: req.user.username });
});

// Get all tickets (Protected)
app.get('/api/tickets', authenticateToken, (req, res) => {
    db.all("SELECT * FROM tickets ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Add a new ticket (Protected)
app.post('/api/tickets', authenticateToken, async (req, res) => {
    const { name, phone, type, price, status } = req.body;
    const date = new Date().toISOString().split('T')[0];

    const sql = "INSERT INTO tickets (name, phone, type, price, status, date, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const params = [name, phone, type, price, status, date, null]; // QR code will be generated after we get the ID

    db.run(sql, params, async function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        const ticketId = this.lastID;

        // Generate QR code with URL pointing to check-in page
        const qrUrl = `${SERVER_URL}/checkin/${ticketId}`;
        const qrCode = await generateQRCode(qrUrl);

        // Update ticket with QR code
        db.run("UPDATE tickets SET qr_code = ? WHERE id = ?", [qrCode, ticketId], (updateErr) => {
            if (updateErr) {
                console.error('Error updating QR code:', updateErr);
            }
        });

        const newTicket = {
            id: ticketId,
            name, phone, type, price, status, date, qr_code: qrCode
        };

        // Send SMS notification if confirmed
        if (status === 'confirmed' && phone) {
            const smsMessage = `Hello ${name}! Your ${type} ticket for the Dinner Event has been confirmed. Ticket ID: ${ticketId}. See you on ${date}!`;
            await sendSMS(phone, smsMessage);
        }

        res.json({
            "message": "success",
            "data": newTicket
        });
    });
});

// Delete a ticket (Protected)
app.delete('/api/tickets/:id', authenticateToken, (req, res) => {
    const sql = "DELETE FROM tickets WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Confirm a ticket (Protected)
app.patch('/api/tickets/:id/confirm', authenticateToken, (req, res) => {
    // First get the ticket details
    db.get("SELECT * FROM tickets WHERE id = ?", [req.params.id], async (err, ticket) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        if (!ticket) {
            res.status(404).json({ "error": "Ticket not found" });
            return;
        }

        // Update status
        const sql = "UPDATE tickets SET status = 'confirmed' WHERE id = ?";
        db.run(sql, req.params.id, async function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }

            // Send SMS notification
            if (ticket.phone) {
                const smsMessage = `Hello ${ticket.name}! Your ${ticket.type} ticket for the Dinner Event has been confirmed. Ticket ID: ${ticket.id}. See you on ${ticket.date}!`;
                await sendSMS(ticket.phone, smsMessage);
            }

            res.json({
                "message": "success",
                "changes": this.changes
            });
        });
    });
});

// Get QR code for a specific ticket
app.get('/api/tickets/:id/qrcode', authenticateToken, (req, res) => {
    db.get("SELECT qr_code FROM tickets WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row || !row.qr_code) {
            res.status(404).json({ "error": "QR code not found" });
            return;
        }
        res.json({ qr_code: row.qr_code });
    });
});

// Serve login page for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve main app (requires authentication check on client side)
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Check-in a ticket (Public/Protected via QR)
app.post('/api/tickets/:id/checkin', (req, res) => {
    const id = req.params.id;
    const timestamp = new Date().toLocaleString();

    db.run("UPDATE tickets SET checked_in = 1, check_in_time = ? WHERE id = ?", [timestamp, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, time: timestamp });
    });
});

// Check-in page - scan QR code to view ticket
app.get('/checkin/:id', (req, res) => {
    db.get("SELECT * FROM tickets WHERE id = ?", [req.params.id], (err, ticket) => {
        if (err || !ticket) {
            res.send(`
                <!DOCTYPE html>
                <html><head><title>Ticket Not Found</title>
                <style>body{font-family:Arial;text-align:center;padding:50px;background:#f5f5f5}
                .container{background:white;padding:40px;border-radius:10px;max-width:400px;margin:0 auto}
                .error{color:#dc2626;font-size:48px}</style></head>
                <body><div class="container"><div class="error">❌</div>
                <h2>Ticket Not Found</h2><p>Invalid ticket ID</p></div></body></html>
            `);
            return;
        }

        const isCheckedIn = ticket.checked_in === 1;
        const statusColor = isCheckedIn ? '#3b82f6' : (ticket.status === 'confirmed' ? '#10b981' :
            ticket.status === 'pending' ? '#f59e0b' : '#ef4444');
        const statusIcon = isCheckedIn ? '🎟️' : (ticket.status === 'confirmed' ? '✅' :
            ticket.status === 'pending' ? '⏳' : '❌');
        const statusText = isCheckedIn ? 'CHECKED IN' : ticket.status.toUpperCase();

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket Check-in</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           padding: 20px; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                    .container { background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 100%; 
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
                    .header { text-align: center; margin-bottom: 30px; }
                    .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; 
                                   font-size: 18px; background: ${statusColor}; color: white; margin-bottom: 20px; }
                    .ticket-info { background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .info-row:last-child { border-bottom: none; }
                    .label { font-weight: 600; color: #6b7280; }
                    .value { color: #1f2937; font-weight: 500; }
                    h1 { color: #1f2937; margin: 0; font-size: 24px; }
                    .icon { font-size: 64px; margin-bottom: 10px; }
                    .btn-checkin { background: #10b981; color: white; border: none; padding: 15px 30px; border-radius: 30px;
                                  font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; transition: transform 0.2s; }
                    .btn-checkin:active { transform: scale(0.98); }
                    .checkin-time { color: #6b7280; font-size: 14px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="icon">${statusIcon}</div>
                        <h1>Dinner Event Ticket</h1>
                        <div class="status-badge">${statusText}</div>
                    </div>
                    <div class="ticket-info">
                        <div class="info-row"><span class="label">Ticket ID:</span><span class="value">#${ticket.id}</span></div>
                        <div class="info-row"><span class="label">Name:</span><span class="value">${ticket.name}</span></div>
                        <div class="info-row"><span class="label">Phone:</span><span class="value">${ticket.phone}</span></div>
                        <div class="info-row"><span class="label">Type:</span><span class="value">${ticket.type}</span></div>
                        <div class="info-row"><span class="label">Price:</span><span class="value">GHS ${ticket.price}</span></div>
                        <div class="info-row"><span class="label">Date:</span><span class="value">${ticket.date}</span></div>
                    </div>
                    
                    <div id="action-area" style="text-align: center;">
                        ${isCheckedIn ?
                `<p class="checkin-time">Checked in at: ${ticket.check_in_time}</p>` :
                (ticket.status === 'confirmed' ?
                    `<button onclick="checkIn()" class="btn-checkin">Check In Now</button>` :
                    `<p style="color: #ef4444;">Cannot check in: Ticket is ${ticket.status}</p>`
                )
            }
                    </div>
                </div>

                <script>
                    function checkIn() {
                        if(!confirm('Confirm check-in for ${ticket.name}?')) return;
                        
                        const btn = document.querySelector('.btn-checkin');
                        btn.textContent = 'Processing...';
                        btn.disabled = true;

                        fetch('/api/tickets/${ticket.id}/checkin', { method: 'POST' })
                            .then(res => res.json())
                            .then(data => {
                                if(data.success) {
                                    location.reload();
                                } else {
                                    alert('Error checking in');
                                    btn.textContent = 'Check In Now';
                                    btn.disabled = false;
                                }
                            })
                            .catch(err => {
                                alert('Network error');
                                btn.textContent = 'Check In Now';
                                btn.disabled = false;
                            });
                    }
                </script>
            </body>
            </html>
        `);
    });
});


// Serve static files (CSS, JS, etc.) - placed after routes to prevent index.html from being served at root
app.use(express.static(path.join(__dirname, '.')));


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Default login - Username: ${process.env.ADMIN_USERNAME}, Password: ${process.env.ADMIN_PASSWORD}`);
});
