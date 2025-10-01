const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ----- In-memory storage for testing -----
const messages = [];

// ----- Nodemailer setup -----
let emailConfigured = false;
let transporter;

console.log('📧 Email credentials check:');
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? '***configured***' : 'NOT SET');

if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  // Verify SMTP connection
  transporter.verify((err, success) => {
    if (err) {
      console.error('❌ SMTP verification failed:', err.message);
      emailConfigured = false;
    } else {
      console.log('✅ SMTP verified successfully! Email will work.');
      emailConfigured = true;
    }
  });
} else {
  console.warn('⚠️ Email credentials missing in .env file');
}

// ----- Contact route -----
app.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !email || !message) {
      return res.status(400).json({ code: 400, message: 'Missing required fields' });
    }

    // Store message
    const newMessage = {
      id: Date.now(),
      firstName,
      lastName,
      email,
      phone,
      message,
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);

    console.log('📩 New message received:', { firstName, email });

    // Try to send email
    if (emailConfigured && transporter) {
      try {
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: process.env.GMAIL_USER,
          subject: `📩 New Contact: ${firstName} ${lastName || ''}`,
          html: `
            <h2>New Portfolio Contact Message</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <h3>Message:</h3>
            <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${message}
            </div>
            <hr>
            <p><small>Sent from Portfolio Contact Form - ${new Date().toLocaleString()}</small></p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        
        return res.status(200).json({ 
          code: 200, 
          message: 'Message sent successfully! Email notification sent.' 
        });
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        return res.status(200).json({ 
          code: 200, 
          message: 'Message received but email notification failed. Please check server logs.' 
        });
      }
    } else {
      console.log('📧 Email not configured, message saved only');
      return res.status(200).json({ 
        code: 200, 
        message: 'Message received (email not configured)' 
      });
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ code: 500, message: 'Server error' });
  }
});

// ----- View messages -----
app.get('/messages', (req, res) => {
  res.json({ messages, count: messages.length });
});

// ----- Health check -----
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API Running',
    email: emailConfigured ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// ----- Test email endpoint -----
app.post('/test-email', async (req, res) => {
  if (!emailConfigured) {
    return res.json({ success: false, message: 'Email not configured' });
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: '🧪 Portfolio Email Test',
      text: 'This is a test email from your portfolio contact form system.'
    });
    
    res.json({ success: true, message: 'Test email sent successfully!' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Email status: ${emailConfigured ? '✅ Ready' : '❌ Not configured'}`);
});