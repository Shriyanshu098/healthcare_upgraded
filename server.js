const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Assessment = require('./models/Assessment');
const EmergencyAlert = require('./models/EmergencyAlert');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oxyaltitude';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend static files directly

// MongoDB Connection
let isMongoConnected = false;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    isMongoConnected = true;
    console.log(`✅ [MongoDB Connected] Successfully connected to database: oxyaltitude at ${MONGODB_URI}`);
    await seedDefaultTeamMembers();
  })
  .catch((err) => {
    isMongoConnected = false;
    console.error('⚠️ [MongoDB Connection Error]:', err.message);
  });

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.log('⚠️ [MongoDB Disconnected]');
});

// Seed default team members if empty
async function seedDefaultTeamMembers() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const defaultUsers = [
        { name: 'Ramjali, Dilip', studentId: '24151017', email: 'ramjalidilipramjali@gmail.com', role: 'Team Lead', age: 22 },
        { name: 'Mishra, Shriyanshu', studentId: '24151552', email: 'shriyanshumishra2@gmail.com', role: 'Team Member', age: 21 },
        { name: 'Akash', studentId: '24151479', email: 'Ay376648@gmail.com', role: 'Team Member', age: 21 }
      ];
      await User.insertMany(defaultUsers);
      console.log('🌱 [MongoDB Seed] Initialized Team Warriors user records');
    }
  } catch (e) {
    console.error('Error seeding default users:', e.message);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check & MongoDB Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    server: 'Node.js Express',
    mongoConnected: isMongoConnected,
    database: isMongoConnected ? 'oxyaltitude' : null,
    timestamp: new Date()
  });
});

// ------------------------------------------
// MODULE 1: USER & TREKKER PROFILE ENDPOINTS
// ------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, studentId, email, role, age } = req.body;
    const user = new User({ name, studentId, email, role, age });
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ------------------------------------------
// MODULE 2: ASSESSMENT RECORDS ENDPOINTS
// ------------------------------------------
app.get('/api/assessments', async (req, res) => {
  try {
    const records = await Assessment.find().sort({ timestamp: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/assessments', async (req, res) => {
  try {
    const {
      recordId,
      userName,
      altitude,
      spo2,
      heartRate,
      age,
      category,
      badgeClass,
      summaryText,
      activeSymptoms,
      symptomCount,
      adviceList
    } = req.body;

    const id = recordId || 'REC-' + Math.floor(1000 + Math.random() * 9000);

    const assessment = new Assessment({
      recordId: id,
      userName: userName || 'Guest Trekker',
      altitude,
      spo2,
      heartRate,
      age,
      category,
      badgeClass,
      summaryText,
      activeSymptoms,
      symptomCount,
      adviceList
    });

    await assessment.save();

    // MODULE 3 LINK: If assessment is High Risk, automatically log into Emergency Alerts collection
    let emergencyAlert = null;
    if (category === 'High Risk') {
      emergencyAlert = new EmergencyAlert({
        alertId: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
        assessmentId: id,
        userName: userName || 'Guest Trekker',
        altitude,
        spo2,
        urgency: spo2 < 75 ? 'CRITICAL EMERGENCY' : 'SEVERE WARNING',
        primaryTrigger: activeSymptoms?.includes('Shortness of Breath at Rest') 
          ? 'Acute Hypoxia & Dyspnea at Rest' 
          : `Critical SpO2 Desaturation (${spo2}%) at ${altitude}m`,
        recommendedAction: 'Immediate descent of at least 500-1000m and supplemental oxygen.'
      });
      await emergencyAlert.save();
      console.log(`🚨 [Emergency Alert Logged in MongoDB]: ${emergencyAlert.alertId} for ${userName}`);
    }

    res.status(201).json({
      success: true,
      data: assessment,
      emergencyAlertGenerated: !!emergencyAlert,
      emergencyAlert
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/assessments/:recordId', async (req, res) => {
  try {
    const deleted = await Assessment.findOneAndDelete({ recordId: req.params.recordId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.json({ success: true, message: 'Assessment record deleted', recordId: req.params.recordId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/assessments', async (req, res) => {
  try {
    await Assessment.deleteMany({});
    res.json({ success: true, message: 'All assessment records cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------
// MODULE 3: EMERGENCY ALERTS ENDPOINTS
// ------------------------------------------
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find().sort({ createdAt: -1 });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 [OxyAltitude Server] Running at: http://localhost:${PORT}`);
  console.log(`📊 [MongoDB API]: http://localhost:${PORT}/api/health`);
});
