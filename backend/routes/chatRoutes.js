const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/authMiddleware');

// @route  GET /api/chat/group
// @desc   Get group chat messages
router.get('/group', auth, async (req, res) => {
  try {
    const messages = await Message.find({ isGroup: true })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  GET /api/chat/private/:userId
// @desc   Get private messages with a specific user
router.get('/private/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      isGroup: false,
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
