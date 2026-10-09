const mongoose = require('mongoose');

// Module 1: User & Trekker Profile Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'Team Member'
  },
  age: {
    type: Number,
    default: 21
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
