require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

// ----- Simple in-memory storage for testing -----
const messages = [];

// ----- Route to accept contact form -----
app.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Basic minimal validation
    if (!firstName || !email || !message) {
      return res.status(400).json({ code: 400, message: 'Please include firstName, email and message.' });
    }

    // Store in memory for now
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
    
    console.log('📩 New message received:', newMessage);

    return res.status(200).json({ code: 200, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ /contact error:', err);
    return res.status(500).json({ code: 500, message: 'Server error. Try again later.' });
  }
});

// ----- Route to view messages (for testing) -----
app.get('/messages', (req, res) => {
  res.json({ messages });
});

// ----- Health check -----
app.get('/', (req, res) => {
  res.json({ message: 'Portfolio Backend API is running!' });
});

// ----- Start server -----
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));