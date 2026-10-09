/**
 * OxyAltitude - Altitude & Health Risk Assessment System
 * Simplified Clinical Rule Engine
 * Team Warriors (Ramjali Dilip, Mishra Shriyanshu, Akash)
 */

const AltitudeCalculator = {
  /**
   * Main Risk Assessment Function
   * Simple, clear rule-based logic that is easy to understand and explain.
   */
  assessHealthRisk(data) {
    const altitude = parseFloat(data.altitude) || 0;
    const spo2 = parseFloat(data.spo2) || 98;
    const heartRate = parseInt(data.heartRate, 10) || 75;
    const age = parseInt(data.age, 10) || 22;
    const symptoms = data.symptoms || {};

    // Count selected symptoms
    let symptomCount = 0;
    const activeSymptoms = [];

    if (symptoms.headache) {
      symptomCount++;
      activeSymptoms.push('Headache');
    }
    if (symptoms.dizziness) {
      symptomCount++;
      activeSymptoms.push('Dizziness');
    }
    if (symptoms.nausea) {
      symptomCount++;
      activeSymptoms.push('Nausea / Vomiting');
    }
    if (symptoms.fatigue) {
      symptomCount++;
      activeSymptoms.push('Fatigue / Weakness');
    }
    if (symptoms.breathlessness) {
      symptomCount++;
      activeSymptoms.push('Shortness of Breath at Rest');
    }

    let category = 'Low Risk';
    let badgeClass = 'low';
    let summaryText = '';
    const adviceList = [];

    // ==========================================
    // SIMPLE 3-TIER RISK RULES
    // ==========================================

    // 1. HIGH RISK (RED)
    if (
      spo2 < 75 ||
      symptoms.breathlessness ||
      (altitude >= 3000 && spo2 < 82) ||
      (altitude >= 2500 && spo2 < 85 && symptomCount >= 3)
    ) {
      category = 'High Risk';
      badgeClass = 'high';
      summaryText = 'Critical warning: Severe oxygen desaturation or acute altitude illness symptoms detected.';
      
      adviceList.push('Descend immediately by at least 500 to 1,000 meters.');
      adviceList.push('Do NOT continue ascending under any circumstances.');
      adviceList.push('Use supplemental oxygen (2–4 L/min) if available.');
      adviceList.push('Seek immediate medical assistance or expedition leader help.');
    }
    // 2. MODERATE RISK (YELLOW)
    else if (
      (spo2 >= 75 && spo2 < 88) ||
      (altitude >= 2500 && symptomCount >= 2) ||
      (altitude >= 3000 && symptoms.headache) ||
      heartRate > 110
    ) {
      category = 'Moderate Risk';
      badgeClass = 'moderate';
      summaryText = 'Caution advised: Mild to moderate altitude symptoms or reduced oxygen saturation.';

      adviceList.push('Halt ascent. Stay at your current altitude for 24–48 hours to acclimatize.');
      adviceList.push('Rest completely and avoid heavy physical exertion.');
      adviceList.push('Drink 3 to 4 liters of clean water with electrolytes daily.');
      adviceList.push('Check your SpO₂ every 3–4 hours. If symptoms get worse, descend.');
    }
    // 3. LOW RISK (GREEN)
    else {
      category = 'Low Risk';
      badgeClass = 'low';
      summaryText = 'Normal physiological adaptation. Oxygen saturation is stable for this elevation.';

      adviceList.push('Continue with planned gradual ascent.');
      adviceList.push('Limit sleeping altitude gain to 500 meters per day above 3,000m.');
      adviceList.push('Stay well hydrated and avoid alcohol or smoking.');
      adviceList.push('Take rest days every 3 to 4 days during mountain treks.');
    }

    // Expected SpO2 range baseline based on altitude
    let expectedSpO2 = '95% – 99%';
    if (altitude >= 4500) {
      expectedSpO2 = '75% – 84%';
    } else if (altitude >= 3500) {
      expectedSpO2 = '84% – 90%';
    } else if (altitude >= 2500) {
      expectedSpO2 = '88% – 93%';
    } else if (altitude >= 1500) {
      expectedSpO2 = '92% – 96%';
    }

    return {
      category,
      badgeClass,
      summaryText,
      adviceList,
      activeSymptoms,
      symptomCount,
      altitude,
      spo2,
      heartRate,
      age,
      expectedSpO2,
      timestamp: new Date().toISOString()
    };
  }
};

// Export to window
if (typeof window !== 'undefined') {
  window.AltitudeCalculator = AltitudeCalculator;
}
