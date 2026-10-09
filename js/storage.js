/**
 * OxyAltitude - Storage & MongoDB API Connector
 * Seamlessly connects to MongoDB backend (localhost:5000) with local offline fallback
 * Team Warriors (Ramjali Dilip, Mishra Shriyanshu, Akash)
 */

const OxyStorage = {
  API_BASE: 'http://localhost:5000/api',
  KEY: 'oxy_altitude_records',
  USER_KEY: 'oxy_altitude_active_user',
  isMongoActive: false,

  TEAM_MEMBERS: [
    { name: 'Mishra, Shriyanshu', studentId: '24151552', email: 'shriyanshumishra2@gmail.com', role: 'Team Member' },
    { name: 'Ramjali, Dilip', studentId: '24151017', email: 'ramjalidilipramjali@gmail.com', role: 'Team Lead' },
    { name: 'Akash', studentId: '24151479', email: 'Ay376648@gmail.com', role: 'Team Member' }
  ],

  async init() {
    // 1. Set local active user if empty
    if (!localStorage.getItem(this.USER_KEY)) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(this.TEAM_MEMBERS[0]));
    }

    // 2. Check live MongoDB backend connection
    return await this.checkBackendStatus();
  },

  async checkBackendStatus() {
    try {
      const res = await fetch(`${this.API_BASE}/health`, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        this.isMongoActive = data.mongoConnected;
        return { isOnline: true, isMongoConnected: data.mongoConnected, database: data.database };
      }
    } catch (e) {
      this.isMongoActive = false;
    }
    return { isOnline: false, isMongoConnected: false, database: null };
  },

  getActiveUser() {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : this.TEAM_MEMBERS[0];
    } catch (e) {
      return this.TEAM_MEMBERS[0];
    }
  },

  setActiveUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  // ---------------------------------------------
  // MODULE 1: USERS (MongoDB / Local)
  // ---------------------------------------------
  async getUsers() {
    if (this.isMongoActive) {
      try {
        const res = await fetch(`${this.API_BASE}/users`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length) return json.data;
        }
      } catch (e) {
        console.warn('Falling back to local users');
      }
    }
    return this.TEAM_MEMBERS;
  },

  // ---------------------------------------------
  // MODULE 2: ASSESSMENTS (MongoDB / Local)
  // ---------------------------------------------
  async getAllAssessments() {
    if (this.isMongoActive) {
      try {
        const res = await fetch(`${this.API_BASE}/assessments`);
        if (res.ok) {
          const json = await res.json();
          return json.data || [];
        }
      } catch (e) {
        console.warn('Falling back to local assessment storage');
      }
    }

    // LocalStorage fallback
    try {
      const raw = localStorage.getItem(this.KEY);
      const list = raw ? JSON.parse(raw) : [];
      return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
      return [];
    }
  },

  async saveAssessment(result) {
    const user = this.getActiveUser();
    const payload = {
      recordId: 'REC-' + Math.floor(1000 + Math.random() * 9000),
      userName: user.name,
      altitude: result.altitude,
      spo2: result.spo2,
      heartRate: result.heartRate,
      age: result.age,
      category: result.category,
      badgeClass: result.badgeClass,
      summaryText: result.summaryText,
      activeSymptoms: result.activeSymptoms,
      symptomCount: result.symptomCount,
      adviceList: result.adviceList,
      timestamp: new Date().toISOString()
    };

    if (this.isMongoActive) {
      try {
        const res = await fetch(`${this.API_BASE}/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (e) {
        console.warn('Failed to save to MongoDB API, saving locally');
      }
    }

    // Local storage fallback
    const list = await this.getAllAssessments();
    list.unshift(payload);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return payload;
  },

  async deleteAssessment(recordId) {
    if (this.isMongoActive) {
      try {
        const res = await fetch(`${this.API_BASE}/assessments/${recordId}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (e) {
        console.warn('Failed to delete via MongoDB API');
      }
    }

    let list = await this.getAllAssessments();
    list = list.filter(item => (item.recordId || item.id) !== recordId);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return true;
  },

  async clearAll() {
    if (this.isMongoActive) {
      try {
        await fetch(`${this.API_BASE}/assessments`, { method: 'DELETE' });
      } catch (e) {}
    }
    localStorage.setItem(this.KEY, JSON.stringify([]));
  },

  // ---------------------------------------------
  // MODULE 3: EMERGENCY ALERTS (MongoDB)
  // ---------------------------------------------
  async getEmergencyAlerts() {
    if (this.isMongoActive) {
      try {
        const res = await fetch(`${this.API_BASE}/alerts`);
        if (res.ok) {
          const json = await res.json();
          return json.data || [];
        }
      } catch (e) {
        console.warn('Error fetching alerts from MongoDB');
      }
    }

    // Local fallback: filter assessments for High Risk
    const assessments = await this.getAllAssessments();
    return assessments.filter(a => a.category === 'High Risk').map(a => ({
      alertId: 'ALT-' + (a.recordId?.replace('REC-', '') || Math.floor(1000 + Math.random() * 9000)),
      assessmentId: a.recordId || a.id,
      userName: a.userName,
      altitude: a.altitude,
      spo2: a.spo2,
      urgency: 'CRITICAL EMERGENCY',
      primaryTrigger: a.activeSymptoms?.join(', ') || 'Severe Hypoxia',
      recommendedAction: 'Immediate descent of at least 500-1000m and supplemental oxygen.',
      status: 'Active',
      createdAt: a.timestamp
    }));
  },

  async exportCSV() {
    const list = await this.getAllAssessments();
    if (!list.length) return alert('No records found to export');

    const headers = ['Record ID', 'Date & Time', 'User', 'Altitude (m)', 'SpO2 (%)', 'Heart Rate (bpm)', 'Risk Level', 'Symptoms'];
    const rows = list.map(r => [
      r.recordId || r.id,
      new Date(r.timestamp).toLocaleString().replace(',', ' '),
      `"${r.userName}"`,
      r.altitude,
      r.spo2,
      r.heartRate,
      r.category,
      `"${r.activeSymptoms?.join(', ') || 'None'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'altitude_health_records.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

if (typeof window !== 'undefined') {
  window.OxyStorage = OxyStorage;
}
