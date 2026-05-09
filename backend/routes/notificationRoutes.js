const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// @route  GET /api/notifications
// @desc   Get all notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name avatar')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  PUT /api/notifications/:id/read
// @desc   Mark a single notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  PUT /api/notifications/read-all
// @desc   Mark ALL notifications as read for the logged-in user
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  DELETE /api/notifications/:id
// @desc   Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
