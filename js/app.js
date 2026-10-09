/**
 * OxyAltitude - App Controller with MongoDB Live Integration
 * Team Warriors (Ramjali Dilip, Mishra Shriyanshu, Akash)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let currentAssessment = null;

  // DOM Elements
  const inputAltitude = document.getElementById('inputAltitude');
  const inputSpo2 = document.getElementById('inputSpo2');
  const inputHeartRate = document.getElementById('inputHeartRate');
  const inputAge = document.getElementById('inputAge');

  // Symptoms
  const symHeadache = document.getElementById('symHeadache');
  const symDizziness = document.getElementById('symDizziness');
  const symNausea = document.getElementById('symNausea');
  const symFatigue = document.getElementById('symFatigue');
  const symBreathless = document.getElementById('symBreathless');

  // Buttons
  const btnAssess = document.getElementById('btnAssess');
  const btnSaveRecord = document.getElementById('btnSaveRecord');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const btnRefreshAlerts = document.getElementById('btnRefreshAlerts');

  // Result Elements
  const resultCard = document.getElementById('resultCard');
  const resBadge = document.getElementById('resBadge');
  const resTitle = document.getElementById('resTitle');
  const resSummary = document.getElementById('resSummary');
  const resExpectedSpo2 = document.getElementById('resExpectedSpo2');
  const resSymptomCount = document.getElementById('resSymptomCount');
  const resAdviceList = document.getElementById('resAdviceList');

  // Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // User Profile & Status Pill
  const userTag = document.getElementById('userTag');
  const activeUserName = document.getElementById('activeUserName');
  const userModal = document.getElementById('userModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const userSelectionList = document.getElementById('userSelectionList');
  const toastBox = document.getElementById('toastBox');
  const mongoPill = document.getElementById('mongoPill');
  const mongoStatusText = document.getElementById('mongoStatusText');

  /**
   * Helper: Show Toast Notification
   */
  function showToast(text) {
    if (!toastBox) return;
    toastBox.textContent = text;
    toastBox.style.display = 'block';
    setTimeout(() => {
      toastBox.style.display = 'none';
    }, 2500);
  }

  /**
   * Initialize MongoDB Connection & Update Status Pill
   */
  async function initBackendStatus() {
    const status = await OxyStorage.init();
    if (status.isOnline && status.isMongoConnected) {
      if (mongoPill) mongoPill.className = 'mongo-pill';
      if (mongoStatusText) mongoStatusText.textContent = `MongoDB: Connected (oxyaltitude)`;
    } else {
      if (mongoPill) mongoPill.className = 'mongo-pill offline';
      if (mongoStatusText) mongoStatusText.textContent = `Local Storage (MongoDB Offline)`;
    }
  }

  /**
   * Tab Navigation
   */
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(tab => {
        if (tab.id === targetId) {
          tab.style.display = 'block';
        } else {
          tab.style.display = 'none';
        }
      });

      if (targetId === 'tab-history') {
        renderHistoryTable();
      } else if (targetId === 'tab-alerts') {
        renderAlertsTable();
      }
    });
  });

  /**
   * Quick Elevation & SpO2 Preset Chips
   */
  document.querySelectorAll('.chip-btn[data-alt]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn[data-alt]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      inputAltitude.value = chip.getAttribute('data-alt');
      runAssessment();
    });
  });

  document.querySelectorAll('.chip-btn[data-spo2]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn[data-spo2]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      inputSpo2.value = chip.getAttribute('data-spo2');
      runAssessment();
    });
  });

  /**
   * Demo Scenarios
   */
  const demoHealthy = document.getElementById('demoHealthy');
  if (demoHealthy) {
    demoHealthy.addEventListener('click', () => {
      inputAltitude.value = 3500;
      inputSpo2.value = 94;
      inputHeartRate.value = 72;
      inputAge.value = 21;
      symHeadache.checked = false;
      symDizziness.checked = false;
      symNausea.checked = false;
      symFatigue.checked = false;
      symBreathless.checked = false;
      runAssessment();
      showToast('Loaded Scenario: Healthy Trekker (Low Risk)');
    });
  }

  const demoModerate = document.getElementById('demoModerate');
  if (demoModerate) {
    demoModerate.addEventListener('click', () => {
      inputAltitude.value = 3500;
      inputSpo2.value = 88;
      inputHeartRate.value = 88;
      inputAge.value = 21;
      symHeadache.checked = true;
      symDizziness.checked = true;
      symNausea.checked = false;
      symFatigue.checked = false;
      symBreathless.checked = false;
      runAssessment();
      showToast('Loaded Scenario: Moderate Altitude Sickness');
    });
  }

  const demoHigh = document.getElementById('demoHigh');
  if (demoHigh) {
    demoHigh.addEventListener('click', () => {
      inputAltitude.value = 4800;
      inputSpo2.value = 73;
      inputHeartRate.value = 118;
      inputAge.value = 21;
      symHeadache.checked = true;
      symDizziness.checked = false;
      symNausea.checked = true;
      symFatigue.checked = true;
      symBreathless.checked = true;
      runAssessment();
      showToast('Loaded Scenario: Critical High Risk Alert');
    });
  }

  /**
   * Main Risk Assessment Action
   */
  function runAssessment() {
    const data = {
      altitude: parseFloat(inputAltitude.value) || 0,
      spo2: parseFloat(inputSpo2.value) || 98,
      heartRate: parseInt(inputHeartRate.value, 10) || 75,
      age: parseInt(inputAge.value, 10) || 22,
      symptoms: {
        headache: symHeadache.checked,
        dizziness: symDizziness.checked,
        nausea: symNausea.checked,
        fatigue: symFatigue.checked,
        breathlessness: symBreathless.checked
      }
    };

    const result = AltitudeCalculator.assessHealthRisk(data);
    currentAssessment = result;

    // Update Result UI
    resultCard.className = `result-box ${result.badgeClass}`;
    resBadge.className = `result-badge ${result.badgeClass}`;
    resBadge.textContent = result.category.toUpperCase();
    resTitle.textContent = result.category;
    resSummary.textContent = result.summaryText;
    resExpectedSpo2.textContent = result.expectedSpO2;
    resSymptomCount.textContent = result.symptomCount === 0 ? 'None' : `${result.symptomCount} Reported`;

    // Recommendations list
    resAdviceList.innerHTML = result.adviceList.map(item => `<li>${item}</li>`).join('');
  }

  btnAssess.addEventListener('click', () => {
    runAssessment();
    showToast(`Assessment: ${currentAssessment.category}`);
  });

  /**
   * Save Assessment to MongoDB & History
   */
  btnSaveRecord.addEventListener('click', async () => {
    if (!currentAssessment) runAssessment();
    const saved = await OxyStorage.saveAssessment(currentAssessment);
    
    if (currentAssessment.category === 'High Risk') {
      showToast(`🚨 High Risk logged to MongoDB + Emergency Alert generated!`);
    } else {
      showToast(`Saved to MongoDB assessments (${saved.recordId || saved.id})`);
    }

    renderHistoryTable();
    renderAlertsTable();
  });

  /**
   * Render Module 2: History Table
   */
  async function renderHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    const list = await OxyStorage.getAllAssessments();
    if (!list.length) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No assessment history in MongoDB. Run an assessment to log data.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list.map(item => {
      const d = new Date(item.timestamp);
      const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const symptomStr = item.activeSymptoms && item.activeSymptoms.length ? item.activeSymptoms.join(', ') : 'None';
      const id = item.recordId || item.id;

      return `
        <tr>
          <td><span style="font-family: monospace; font-size: 0.78rem; color: #94a3b8;">${id}</span></td>
          <td>${dateStr}</td>
          <td><strong>${item.userName || 'Trekker'}</strong></td>
          <td>${item.altitude} m</td>
          <td><strong style="color: ${item.spo2 < 80 ? '#ef4444' : (item.spo2 < 90 ? '#f59e0b' : '#10b981')}">${item.spo2}%</strong></td>
          <td>${item.heartRate} bpm</td>
          <td><span style="font-size: 0.78rem; color: var(--text-muted);">${symptomStr}</span></td>
          <td><span class="badge-pill ${item.badgeClass}">${item.category}</span></td>
          <td>
            <button class="chip-btn btn-del-record" data-id="${id}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">✕ Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.btn-del-record').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await OxyStorage.deleteAssessment(id);
        renderHistoryTable();
        showToast('Record deleted from MongoDB');
      });
    });
  }

  /**
   * Render Module 3: Emergency Alerts Table
   */
  async function renderAlertsTable() {
    const tableBody = document.getElementById('alertsTableBody');
    if (!tableBody) return;

    const alerts = await OxyStorage.getEmergencyAlerts();
    if (!alerts.length) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No emergency alerts logged in MongoDB yet. All vitals safe.</td></tr>`;
      return;
    }

    tableBody.innerHTML = alerts.map(alt => {
      const d = new Date(alt.createdAt || alt.timestamp);
      const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return `
        <tr>
          <td><span style="font-family: monospace; font-size: 0.78rem; color: #f87171; font-weight: 700;">${alt.alertId}</span></td>
          <td>${dateStr}</td>
          <td><strong>${alt.userName}</strong></td>
          <td>${alt.altitude}m / <strong style="color: #ef4444;">${alt.spo2}%</strong></td>
          <td><span style="font-size: 0.8rem; color: #fca5a5;">${alt.primaryTrigger}</span></td>
          <td><span style="font-size: 0.78rem; color: #cbd5e1;">${alt.recommendedAction}</span></td>
          <td><span class="badge-pill high">${alt.status || 'Active'}</span></td>
        </tr>
      `;
    }).join('');
  }

  if (btnRefreshAlerts) {
    btnRefreshAlerts.addEventListener('click', () => {
      renderAlertsTable();
      showToast('Refreshed alerts from MongoDB');
    });
  }

  /**
   * Export & Clear Handlers
   */
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => OxyStorage.exportCSV());
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
      if (confirm('Clear all assessment history from MongoDB?')) {
        await OxyStorage.clearAll();
        renderHistoryTable();
        renderAlertsTable();
        showToast('MongoDB assessments cleared');
      }
    });
  }

  /**
   * User Switch Modal (Loaded from MongoDB Module 1)
   */
  function updateActiveUserDisplay() {
    const user = OxyStorage.getActiveUser();
    if (activeUserName) activeUserName.textContent = user.name;
  }

  userTag.addEventListener('click', async () => {
    const list = await OxyStorage.getUsers();
    const current = OxyStorage.getActiveUser();

    userSelectionList.innerHTML = list.map(m => `
      <button type="button" class="chip-btn select-user-btn" data-id="${m.studentId || m.id}" style="text-align: left; padding: 0.6rem 0.8rem; display: flex; justify-content: space-between; ${(m.studentId || m.id) === (current.studentId || current.id) ? 'border-color: var(--accent-light); color: #fff; background: rgba(56, 189, 248, 0.15);' : ''}">
        <span><strong>${m.name}</strong> (${m.role})</span>
        <span style="font-size: 0.75rem; color: var(--text-dim);">ID: ${m.studentId || m.id}</span>
      </button>
    `).join('');

    userSelectionList.querySelectorAll('.select-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = list.find(m => (m.studentId || m.id) === id);
        if (found) {
          OxyStorage.setActiveUser(found);
          updateActiveUserDisplay();
          userModal.classList.remove('active');
          showToast(`Active trekker: ${found.name}`);
        }
      });
    });

    userModal.classList.add('active');
  });

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => userModal.classList.remove('active'));
  }

  window.addEventListener('click', (e) => {
    if (e.target === userModal) userModal.classList.remove('active');
  });

  // Initial Boot
  updateActiveUserDisplay();
  await initBackendStatus();
  runAssessment();
  await renderHistoryTable();
  await renderAlertsTable();
});
