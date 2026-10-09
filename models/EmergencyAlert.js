const mongoose = require('mongoose');

// Module 3: Emergency & High-Risk Alert Logs Schema
const emergencyAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  assessmentId: {
    type: String,
    required: true
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
  urgency: {
    type: String,
    enum: ['CRITICAL EMERGENCY', 'SEVERE WARNING'],
    default: 'CRITICAL EMERGENCY'
  },
  primaryTrigger: {
    type: String,
    required: true
  },
  recommendedAction: {
    type: String,
    default: 'Mandatory immediate descent of at least 500-1000m and oxygen administration.'
  },
  status: {
    type: String,
    enum: ['Active', 'Acknowledged', 'Resolved'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
