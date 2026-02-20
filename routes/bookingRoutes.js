const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { createBooking, getBookingsByEmail, updateBookingStatus } = require('../controllers/bookingController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// POST /bookings
router.post(
  '/',
  [
    body('expertId').isMongoId().withMessage('Invalid expert ID'),
    body('userName').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone')
      .matches(/^\+?[\d\s\-().]{7,17}$/)
      .withMessage('Valid phone number is required'),
    body('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format')
      .custom((val) => {
        if (val < new Date().toISOString().split('T')[0]) {
          throw new Error('Date must be today or in the future');
        }
        return true;
      }),
    body('timeSlot').matches(/^\d{2}:\d{2}$/).withMessage('Time slot must be in HH:MM format'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes max 500 characters'),
  ],
  validate,
  createBooking
);

// GET /bookings?email=
router.get(
  '/',
  [query('email').isEmail().withMessage('Valid email is required')],
  validate,
  getBookingsByEmail
);

// PATCH /bookings/:id/status
router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid booking ID'),
    body('status')
      .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateBookingStatus
);

module.exports = router;
