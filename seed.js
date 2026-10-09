/**
 * OxyAltitude - MongoDB Seed Script
 * Populates MongoDB with realistic initial cohort records
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Assessment = require('./models/Assessment');
const EmergencyAlert = require('./models/EmergencyAlert');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oxyaltitude';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at', MONGODB_URI);

    // Clear existing
    await User.deleteMany({});
    await Assessment.deleteMany({});
    await EmergencyAlert.deleteMany({});
    console.log('Cleared existing collections...');

    // 1. Seed Module 1: Users
    const users = [
      { name: 'Ramjali, Dilip', studentId: '24151017', email: 'ramjalidilipramjali@gmail.com', role: 'Team Lead', age: 22 },
      { name: 'Mishra, Shriyanshu', studentId: '24151552', email: 'shriyanshumishra2@gmail.com', role: 'Team Member', age: 21 },
      { name: 'Akash', studentId: '24151479', email: 'Ay376648@gmail.com', role: 'Team Member', age: 21 }
    ];
    await User.insertMany(users);
    console.log('✅ Seeded Module 1: Users (3 records)');

    // 2. Seed Module 2: Assessments
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const assessments = [
      {
        recordId: 'REC-1021',
        userName: 'Mishra, Shriyanshu',
        altitude: 2050,
        spo2: 97,
        heartRate: 72,
        age: 21,
        category: 'Low Risk',
        badgeClass: 'low',
        summaryText: 'Normal physiological adaptation. Oxygen saturation is stable for this elevation.',
        activeSymptoms: [],
        symptomCount: 0,
        adviceList: ['Continue with planned gradual ascent.', 'Stay well hydrated.'],
        timestamp: new Date(now - 2 * day)
      },
      {
        recordId: 'REC-1044',
        userName: 'Mishra, Shriyanshu',
        altitude: 3500,
        spo2: 89,
        heartRate: 84,
        age: 21,
        category: 'Moderate Risk',
        badgeClass: 'moderate',
        summaryText: 'Caution advised: Mild to moderate altitude symptoms or reduced oxygen saturation.',
        activeSymptoms: ['Headache', 'Dizziness'],
        symptomCount: 2,
        adviceList: ['Halt ascent for 24 hours to acclimatize.', 'Rest and drink 3-4 liters of water.'],
        timestamp: new Date(now - 1 * day)
      },
      {
        recordId: 'REC-1089',
        userName: 'Mishra, Shriyanshu',
        altitude: 4800,
        spo2: 74,
        heartRate: 115,
        age: 21,
        category: 'High Risk',
        badgeClass: 'high',
        summaryText: 'Critical warning: Severe oxygen desaturation or acute altitude illness symptoms detected.',
        activeSymptoms: ['Headache', 'Shortness of Breath at Rest'],
        symptomCount: 2,
        adviceList: ['Descend immediately by at least 500 to 1,000 meters.', 'Do not ascend further.'],
        timestamp: new Date(now - 4 * 60 * 60 * 1000)
      }
    ];
    await Assessment.insertMany(assessments);
    console.log('✅ Seeded Module 2: Assessments (3 records)');

    // 3. Seed Module 3: Emergency Alerts
    const alerts = [
      {
        alertId: 'ALT-1089',
        assessmentId: 'REC-1089',
        userName: 'Mishra, Shriyanshu',
        altitude: 4800,
        spo2: 74,
        urgency: 'CRITICAL EMERGENCY',
        primaryTrigger: 'Critical SpO2 Desaturation (74%) & Dyspnea at 4800m',
        recommendedAction: 'Immediate descent of at least 500-1000m and supplemental oxygen.',
        status: 'Active',
        createdAt: new Date(now - 4 * 60 * 60 * 1000)
      }
    ];
    await EmergencyAlert.insertMany(alerts);
    console.log('✅ Seeded Module 3: Emergency Alerts (1 record)');

    console.log('🎉 MongoDB Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedData();
