require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

// ----- MongoDB connection -----
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

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

    // Basic minimal validation (you can extend)
    if (!firstName || !email || !message) {
      return res.status(400).json({ code: 400, message: 'Please include firstName, email and message.' });
    }

    // Save to MongoDB
    const doc = new Message({ firstName, lastName, email, phone, message });
    await doc.save();
    console.log('📩 Message saved to database');

    // Send email to yourself if configured
    if (emailConfigured && transporter) {
      try {
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: process.env.GMAIL_USER,
          subject: '📩 New Contact Form Message - Portfolio',
          html: `
            <h2>New Contact Form Message</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff;">
              ${message}
            </div>
            <hr>
            <p><small>Sent from your portfolio contact form at ${new Date().toLocaleString()}</small></p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('✉️ Email sent successfully to:', process.env.GMAIL_USER);
      } catch (emailError) {
        console.warn('⚠️ Failed to send email:', emailError.message);
        // Don't fail the request if email fails
      }
    } else {
      console.log('📧 Email not configured, skipping email send');
    }

    return res.status(200).json({ code: 200, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ /contact error:', err);
    return res.status(500).json({ code: 500, message: 'Server error. Try again later.' });
  }
});

// ----- Start server -----
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
