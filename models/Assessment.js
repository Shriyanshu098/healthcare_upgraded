const mongoose = require('mongoose');

// Module 2: Assessment & Health Record Schema
const assessmentSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: true
  },
  altitude: {
    type: Number,
    required: true
  },
  spo2: {
    type: Number,
    required: true
  },
  heartRate: {
    type: Number,
    required: true
  },
  age: {
    type: Number,
    default: 22
  },
  category: {
    type: String,
    enum: ['Low Risk', 'Moderate Risk', 'High Risk'],
    required: true
  },
  badgeClass: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'low'
  },
  summaryText: {
    type: String,
    default: ''
  },
  activeSymptoms: {
    type: [String],
    default: []
  },
  symptomCount: {
    type: Number,
    default: 0
  },
  adviceList: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assessment', assessmentSchema);
