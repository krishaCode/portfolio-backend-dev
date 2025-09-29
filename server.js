require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

// ----- MongoDB connection -----
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// optional: verify SMTP connection on startup
transporter.verify((err, success) => {
  if (err) console.error('✉️ SMTP verify failed:', err);
  else console.log('✉️ SMTP ready');
});

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

    // Send email to yourself
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: '📩 New Contact Form Message',
      text: `
You have a new contact message:
Name: ${firstName} ${lastName || ''}
Email: ${email}
Phone: ${phone || 'N/A'}

Message:
${message}
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ code: 200, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ /contact error:', err);
    return res.status(500).json({ code: 500, message: 'Server error. Try again later.' });
  }
});

// ----- Start server -----
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
