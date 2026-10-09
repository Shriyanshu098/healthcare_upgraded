/**
 * OxyAltitude - Data Visualization & Analytics Charts
 * Integrates Chart.js with pure HTML5 Canvas fallback for 100% offline reliability
 * Team Warriors (Ramjali Dilip, Mishra Shriyanshu, Akash)
 */

const OxyCharts = {
  altitudeTrendChart: null,
  riskDistributionChart: null,
  symptomChart: null,

  initTrendChart(canvasId, records) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sort chronologically for trend
    const sorted = [...records].reverse();
    const labels = sorted.map((r, i) => {
      const d = new Date(r.timestamp || r.savedAt);
      return `${d.getMonth() + 1}/${d.getDate()} (${r.environmental?.altitudeMeters || r.altitude || 0}m)`;
    });

    const altitudes = sorted.map(r => r.environmental?.altitudeMeters || r.altitude || 0);
    const spo2Levels = sorted.map(r => r.vitals?.spo2 || r.spo2 || 95);
    const heartRates = sorted.map(r => r.vitals?.heartRate || r.heartRate || 75);

    if (window.Chart) {
      if (this.altitudeTrendChart) {
        this.altitudeTrendChart.destroy();
      }

      this.altitudeTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [
            {
              label: 'SpO₂ Oxygen (%)',
              data: spo2Levels.length ? spo2Levels : [98],
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              borderWidth: 3,
              tension: 0.35,
              fill: false,
              yAxisID: 'ySpO2',
              pointRadius: 6,
              pointHoverRadius: 8
            },
            {
              label: 'Heart Rate (bpm)',
              data: heartRates.length ? heartRates : [72],
              borderColor: '#f43f5e',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.35,
              fill: false,
              yAxisID: 'yHR',
              pointRadius: 4
            },
            {
              label: 'Altitude (m)',
              data: altitudes.length ? altitudes : [0],
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderWidth: 2,
              tension: 0.25,
              fill: true,
              yAxisID: 'yAlt',
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              labels: {
                color: '#94a3b8',
                font: { family: 'Inter, sans-serif', size: 12 }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#38bdf8',
              borderColor: '#334155',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: { color: '#94a3b8' }
            },
            ySpO2: {
              type: 'linear',
              position: 'left',
              min: 60,
              max: 100,
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: {
                color: '#06b6d4',
                callback: v => v + '%'
              },
              title: { display: true, text: 'SpO₂ (%)', color: '#06b6d4' }
            },
            yHR: {
              type: 'linear',
              position: 'right',
              min: 50,
              max: 140,
              grid: { drawOnChartArea: false },
              ticks: { color: '#f43f5e' },
              title: { display: true, text: 'Pulse (bpm)', color: '#f43f5e' }
            },
            yAlt: {
              type: 'linear',
              position: 'right',
              min: 0,
              max: 6000,
              grid: { drawOnChartArea: false },
              ticks: { color: '#818cf8', callback: v => v + 'm' },
              title: { display: true, text: 'Elevation (m)', color: '#818cf8' }
            }
          }
        }
      });
    } else {
      // Offline pure HTML5 Canvas fallback
      this.drawCanvasFallbackTrend(ctx, canvas, altitudes, spo2Levels);
    }
  },

  initDistributionChart(canvasId, records) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const lowCount = records.filter(r => r.category === 'Low Risk').length;
    const modCount = records.filter(r => r.category === 'Moderate Risk').length;
    const highCount = records.filter(r => r.category === 'High Risk').length;

    if (window.Chart) {
      if (this.riskDistributionChart) {
        this.riskDistributionChart.destroy();
      }

      this.riskDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
          datasets: [{
            data: [lowCount, modCount, highCount],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderColor: '#0f172a',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', font: { family: 'Inter, sans-serif' } }
            }
          },
          cutout: '68%'
        }
      });
    } else {
      this.drawCanvasFallbackDoughnut(ctx, canvas, [lowCount, modCount, highCount]);
    }
  },

  drawCanvasFallbackTrend(ctx, canvas, altitudes, spo2Levels) {
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = canvas.parentElement.clientHeight || 260;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Oxygen vs Altitude Trend (Offline Native View)', 15, 25);

    if (!spo2Levels.length) return;

    // Draw baseline grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = (h - 40) * (i / 5) + 30;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    // Draw SpO2 line
    const stepX = (w - 70) / Math.max(1, spo2Levels.length - 1);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();

    spo2Levels.forEach((val, idx) => {
      const x = 50 + idx * stepX;
      // map 60-100% to height
      const y = (h - 50) - ((val - 60) / 40) * (h - 70);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    spo2Levels.forEach((val, idx) => {
      const x = 50 + idx * stepX;
      const y = (h - 50) - ((val - 60) / 40) * (h - 70);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  drawCanvasFallbackDoughnut(ctx, canvas, counts) {
    const w = canvas.width = 240;
    const h = canvas.height = 240;
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const colors = ['#10b981', '#f59e0b', '#ef4444'];
    let startAngle = 0;

    ctx.clearRect(0, 0, w, h);
    counts.forEach((count, i) => {
      const sliceAngle = (count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 70, startAngle, startAngle + sliceAngle);
      ctx.arc(w / 2, h / 2, 45, startAngle + sliceAngle, startAngle, true);
      ctx.fillStyle = colors[i];
      ctx.fill();
      startAngle += sliceAngle;
    });

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${total} Records`, w / 2, h / 2 + 5);
  }
};

if (typeof window !== 'undefined') {
  window.OxyCharts = OxyCharts;
}
