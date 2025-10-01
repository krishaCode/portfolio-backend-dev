require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

// ----- In-memory storage as fallback -----
const messages = [];

// ----- MongoDB connection (optional) -----
let mongoConnected = false;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio')
.then(() => {
  console.log('✅ MongoDB connected');
  mongoConnected = true;
})
.catch(err => {
  console.warn('⚠️ MongoDB connection failed, using in-memory storage:', err.message);
  mongoConnected = false;
});

// ----- Mongoose schema -----
const messageSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ----- Nodemailer setup (Gmail App Password) -----
let emailConfigured = false;
let transporter;

if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  // Verify SMTP connection on startup
  transporter.verify((err, success) => {
    if (err) {
      console.warn('⚠️ SMTP verify failed, emails will not be sent:', err.message);
      emailConfigured = false;
    } else {
      console.log('✉️ SMTP ready - emails will be sent');
      emailConfigured = true;
    }
  });
} else {
  console.warn('⚠️ Email credentials not found, emails will not be sent');
}

// ----- Route to accept contact form -----
app.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Basic minimal validation
    if (!firstName || !email || !message) {
      return res.status(400).json({ 
        code: 400, 
        message: 'Please include firstName, email and message.' 
      });
    }

    const messageData = {
      firstName,
      lastName,
      email,
      phone,
      message,
      timestamp: new Date().toISOString()
    };

    // Try to save to MongoDB, fallback to in-memory
    if (mongoConnected) {
      try {
        const doc = new Message(messageData);
        await doc.save();
        console.log('📩 Message saved to MongoDB');
      } catch (dbError) {
        console.warn('⚠️ Failed to save to MongoDB, using in-memory storage:', dbError.message);
        messageData.id = Date.now();
        messages.push(messageData);
      }
    } else {
      messageData.id = Date.now();
      messages.push(messageData);
      console.log('📩 Message saved to in-memory storage');
    }

    // Try to send email if configured
    if (emailConfigured) {
      try {
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: process.env.GMAIL_USER,
          subject: '📩 New Contact Form Message',
          html: `
            <h2>New Contact Form Message</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p><small>Sent from your portfolio contact form</small></p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('✉️ Email sent successfully');
      } catch (emailError) {
        console.warn('⚠️ Failed to send email:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    console.log('📩 New message received:', messageData);

    return res.status(200).json({ 
      code: 200, 
      message: 'Message sent successfully!' 
    });
  } catch (err) {
    console.error('❌ /contact error:', err);
    return res.status(500).json({ 
      code: 500, 
      message: 'Server error. Try again later.' 
    });
  }
});

// ----- Route to view messages (for testing) -----
app.get('/messages', async (req, res) => {
  try {
    let allMessages = [];
    
    if (mongoConnected) {
      try {
        const dbMessages = await Message.find().sort({ date: -1 });
        allMessages = dbMessages;
      } catch (dbError) {
        console.warn('Failed to fetch from MongoDB, using in-memory:', dbError.message);
        allMessages = messages.reverse();
      }
    } else {
      allMessages = messages.reverse();
    }
    
    res.json({ 
      messages: allMessages,
      source: mongoConnected ? 'mongodb' : 'memory',
      count: allMessages.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- Health check -----
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio Backend API is running!',
    status: {
      mongodb: mongoConnected ? 'connected' : 'disconnected',
      email: emailConfigured ? 'configured' : 'not configured'
    }
  });
});

// ----- Start server -----
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Status: MongoDB ${mongoConnected ? '✅' : '❌'}, Email ${emailConfigured ? '✅' : '❌'}`);
});