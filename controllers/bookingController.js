const Booking = require('../models/Booking');
const Expert = require('../models/Expert');

// POST /bookings
const createBooking = async (req, res, next) => {
  try {
    const { expertId, userName, email, phone, date, timeSlot, notes } = req.body;

    // Atomically find the expert and mark the slot as booked in ONE operation.
    // This works on standalone MongoDB (no replica set needed) and prevents race conditions.
    const expert = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        'availableSlots.date': date,
        'availableSlots.time': timeSlot,
        'availableSlots.isBooked': false,
      },
      {
        $set: { 'availableSlots.$.isBooked': true },
      },
      { new: true }
    );

    if (!expert) {
      return res.status(409).json({
        error: 'This time slot is no longer available. Please select another slot.',
      });
    }

    // Create the booking record
    const booking = new Booking({
      expertId,
      expertName: expert.name,
      userName,
      email,
      phone,
      date,
      timeSlot,
      notes,
    });

    await booking.save();

    // Store the bookingId reference on the slot (best-effort, non-critical)
    await Expert.updateOne(
      { _id: expertId, 'availableSlots.date': date, 'availableSlots.time': timeSlot },
      { $set: { 'availableSlots.$.bookingId': booking._id } }
    );

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`expert-${expertId}`).emit('slot-booked', {
        expertId,
        date,
        timeSlot,
        bookingId: booking._id,
      });
    }

    res.status(201).json({
      message: 'Booking created successfully!',
      booking,
    });
  } catch (err) {
    // Handle duplicate key error (compound index as final safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'This time slot was just booked by someone else. Please select another slot.',
      });
    }
    next(err);
  }
};

// GET /bookings?email=
const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const bookings = await Booking.find({ email: email.toLowerCase().trim() })
      .populate('expertId', 'name category avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
};

// PATCH /bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If cancelled, free up the slot
    if (status === 'cancelled') {
      await Expert.updateOne(
        {
          _id: booking.expertId,
          'availableSlots.date': booking.date,
          'availableSlots.time': booking.timeSlot,
        },
        {
          $set: {
            'availableSlots.$.isBooked': false,
            'availableSlots.$.bookingId': null,
          },
        }
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`expert-${booking.expertId}`).emit('slot-released', {
          expertId: booking.expertId,
          date: booking.date,
          timeSlot: booking.timeSlot,
        });
      }
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getBookingsByEmail, updateBookingStatus };
