const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  },
  // Role-based access: 'admin' (full access), 'manager' (can assign tasks), 'member' (can only work on tasks)
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    default: 'member'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
