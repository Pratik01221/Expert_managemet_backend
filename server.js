require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const expertRoutes = require('./routes/expertRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// normalize client URL
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000')
  .replace(/\/+$/g, '');

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.set('io', io);

// Middleware
app.use(cors({ origin: clientUrl }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ================= ROUTES =================

app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);

// TEMPORARY SEED ROUTE (REMOVE AFTER USE)
app.get('/api/seed', async (req, res) => {
  try {
    const Expert = require('./models/Expert');
    await Expert.deleteMany({});

    const generateSlots = () => {
      const slots = [];
      const today = new Date();

      for (let d = 1; d <= 14; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];

        ['09:00','10:00','11:00','14:00','15:00','16:00','17:00']
          .forEach(time => {
            slots.push({
              date: dateStr,
              time,
              isBooked: false
            });
          });
      }
      return slots;
    };

    const experts = [
      {
        name: 'Dr. Sarah Chen',
        category: 'Technology',
        experience: 12,
        rating: 4.9,
        totalReviews: 187,
        bio: 'AI/ML expert with 12 years building scalable systems.',
        hourlyRate: 5000,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        availableSlots: generateSlots(),
      },
      {
        name: 'Marcus Williams',
        category: 'Business',
        experience: 15,
        rating: 4.8,
        totalReviews: 234,
        bio: 'Serial entrepreneur and business consultant.',
        hourlyRate: 6000,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
        availableSlots: generateSlots(),
      },
      {
        name: 'Priya Sharma',
        category: 'Marketing',
        experience: 10,
        rating: 4.6,
        totalReviews: 198,
        bio: 'Growth marketing expert.',
        hourlyRate: 4500,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        availableSlots: generateSlots(),
      }
    ];

    await Expert.insertMany(experts);

    res.json({
      success: true,
      message: `Seeded ${experts.length} experts successfully!`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-expert', (expertId) => {
    socket.join(`expert-${expertId}`);
  });

  socket.on('leave-expert', (expertId) => {
    socket.leave(`expert-${expertId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB connect
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-booking';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };