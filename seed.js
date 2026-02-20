require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('./models/Expert');

const generateSlots = () => {
  const slots = [];
  const today = new Date();
  for (let d = 1; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    times.forEach((time) => {
      slots.push({ date: dateStr, time, isBooked: false });
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
    bio: 'AI/ML expert with 12 years building scalable systems at Google and Meta. PhD in Computer Science from Stanford.',
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
    bio: 'Serial entrepreneur who has founded 3 successful startups. Former McKinsey consultant specializing in growth strategy.',
    hourlyRate: 6000,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    availableSlots: generateSlots(),
  },
  {
    name: 'Elena Rodriguez',
    category: 'Design',
    experience: 8,
    rating: 4.7,
    totalReviews: 156,
    bio: 'UX/UI design lead at Airbnb. Specializes in design systems and user research for consumer products.',
    hourlyRate: 3500,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
    availableSlots: generateSlots(),
  },
  {
    name: 'James Okafor',
    category: 'Finance',
    experience: 20,
    rating: 4.9,
    totalReviews: 312,
    bio: 'CFA with 20 years in investment banking. Expert in portfolio management, M&A, and startup fundraising.',
    hourlyRate: 8000,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    availableSlots: generateSlots(),
  },
  {
    name: 'Priya Sharma',
    category: 'Marketing',
    experience: 10,
    rating: 4.6,
    totalReviews: 198,
    bio: 'Growth marketing expert who scaled companies from 0 to $100M ARR. Former CMO at two unicorn startups.',
    hourlyRate: 4500,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. Michael Thompson',
    category: 'Health',
    experience: 18,
    rating: 4.8,
    totalReviews: 145,
    bio: 'Board-certified physician specializing in preventive medicine and corporate wellness programs.',
    hourlyRate: 7000,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    availableSlots: generateSlots(),
  },
  {
    name: 'Amanda Foster',
    category: 'Legal',
    experience: 14,
    rating: 4.7,
    totalReviews: 89,
    bio: 'Startup and tech law specialist. Expert in IP protection, fundraising agreements, and employment law.',
    hourlyRate: 6500,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amanda',
    availableSlots: generateSlots(),
  },
  {
    name: 'Kevin Zhang',
    category: 'Education',
    experience: 9,
    rating: 4.5,
    totalReviews: 267,
    bio: 'EdTech founder and former Harvard professor. Expert in curriculum design and online learning platforms.',
    hourlyRate: 3000,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin',
    availableSlots: generateSlots(),
  },
  {
    name: 'Natasha Ivanova',
    category: 'Technology',
    experience: 11,
    rating: 4.8,
    totalReviews: 203,
    bio: 'Cybersecurity architect with experience securing Fortune 500 companies. CISSP and CEH certified.',
    hourlyRate: 5500,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=natasha',
    availableSlots: generateSlots(),
  },
];

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-booking')
  .then(async () => {
    await Expert.deleteMany({});
    await Expert.insertMany(experts);
    console.log('✅ Database seeded with', experts.length, 'experts');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
