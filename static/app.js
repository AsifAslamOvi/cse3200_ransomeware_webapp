// ============================================
// RANSOMWARE DETECTION DASHBOARD - ENHANCED
// ============================================

// Toast notifications
function showToast(message, type = 'info') {
  const toastHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="animation: slideIn 0.3s ease-out; position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;">
      <i class="fas fa-info-circle me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', toastHtml);
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    if (alerts.length > 0) alerts[alerts.length - 1].remove();
  }, 5000);
}

// ============ UTILITIES ============

function formatPercent(val) {
  const num = parseFloat(val);
  return `${(num * 100).toFixed(2)}%`;
}

// ============ API CALLS ============

async function fetchStats() {
  try {
    const r = await fetch('/api/stats');
    return r.ok ? r.json() : null;
  } catch (e) {
    console.error('Error fetching stats:', e);
    return null;
  }
}

async function fetchMetrics() {
  try {
    const r = await fetch('/api/metrics');
    return r.ok ? r.json() : null;
  } catch (e) {
    console.error('Error fetching metrics:', e);
    return null;
  }
}

// ============ VISUALIZATION ============

function drawClassChart(ctx, counts) {
  if (!ctx) return;
  
  const labels = ['Ransomware', 'Benign'];
  const data = [counts['0'] || 0, counts['1'] || 0];
  const colors = ['#dc2626', '#16a34a'];

  if (window.classChart) {
    window.classChart.destroy();
  }

  try {
    window.classChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: ['white'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: 'bold' },
              padding: 15,
              usePointStyle: true
            }
          }
        }
      }
    });
  } catch (e) {
    console.error('Chart error:', e);
  }
}

// ============ RANDOM DATA ============

async function generateRandomRow() {
  try {
    const stats = await fetchStats();
    if (!stats) {
      showToast('Could not generate random row', 'danger');
      return;
    }

    const means = stats.feature_means || {};
    const stds = stats.feature_stds || {};
    const obj = {};

    for (const k of Object.keys(means)) {
      const mean = Number(means[k]) || 0;
      const std = Math.abs(Number(stds[k])) || 0;
      let val;

      if (std > 0) {
        const u1 = Math.random() || 1e-9;
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        val = Math.round(mean + z * std);
      } else {
        if (mean === 0) {
          val = Math.round(Math.random() * 1000);
        } else {
          val = Math.round(mean * (0.5 + Math.random()));
        }
      }

      if (Number.isNaN(val) || val === null) val = Math.round(mean || 0);
      obj[k] = val;
    }

    document.getElementById('rowInput').value = JSON.stringify(obj, null, 2);
    showToast('✓ Random row generated', 'success');
  } catch (e) {
    console.error('Error generating random row:', e);
    showToast('Failed to generate random row', 'danger');
  }
}

// ============ TRAINING ============

async function trainModel() {
  try {
    const btn = document.getElementById('trainBtn');
    const statusEl = document.getElementById('trainStatus');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Training...';
    statusEl.innerHTML = '<span class="spinner" style="display: inline-block; margin-right: 8px;"></span> Training in progress...';

    const response = await fetch('/api/train', { method: 'POST' });
    const result = await response.json();

    if (response.ok) {
      showToast('✓ Model trained successfully!', 'success');
      await refreshDashboard();
      statusEl.innerHTML = '<span style="color: #16a34a;"><i class="fas fa-check-circle"></i> Training complete</span>';
    } else {
      showToast('✗ Training failed', 'danger');
      statusEl.innerHTML = '<span style="color: #dc2626;"><i class="fas fa-times-circle"></i> Training failed</span>';
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-redo"></i> Train Model';
  } catch (e) {
    console.error('Error training model:', e);
    showToast('Training error: ' + e.message, 'danger');
    const btn = document.getElementById('trainBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-redo"></i> Train Model';
  }
}

// ============ PREDICTIONS ============

async function makePrediction(event) {
  event.preventDefault();

  try {
    const rowInput = document.getElementById('rowInput').value;
    let rowData;

    try {
      rowData = JSON.parse(rowInput);
    } catch (e) {
      showToast('Invalid JSON in feature vector', 'danger');
      return;
    }

    const predOutEl = document.getElementById('predOut');
    predOutEl.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Making prediction...</p></div>';

    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowData)
    });

    const prediction = await response.json();

    if (response.ok) {
      // Display prediction
      predOutEl.innerHTML = `<pre style="color: #1f2937; white-space: pre-wrap;">${JSON.stringify(prediction, null, 2)}</pre>`;

      // Risk level color
      const riskColors = {
        'High': { bg: '#fee2e2', text: '#991b1b', icon: 'fa-shield-exclamation' },
        'Medium': { bg: '#fed7aa', text: '#92400e', icon: 'fa-exclamation-circle' },
        'Low': { bg: '#dcfce7', text: '#166534', icon: 'fa-check-circle' }
      };

      const riskInfo = riskColors[prediction.risk_level] || riskColors['Low'];

      // Mitigation area
      const mitigationArea = document.getElementById('mitigationArea');
      let html = `
        <div class="alert" style="background: ${riskInfo.bg}; border-left-color: ${riskInfo.text}; border-left-width: 4px; color: ${riskInfo.text};">
          <i class="fas ${riskInfo.icon} me-2"></i>
          <strong>${prediction.prediction_label}</strong> - Risk: <strong>${prediction.risk_level}</strong><br>
          Confidence: <strong>${prediction.confidence}</strong><br>
          Ransomware Probability: <strong>${(prediction.probabilities?.ransomware * 100).toFixed(2)}%</strong>
        </div>
      `;

      if (prediction.risk_level === 'High') {
        html += `
          <button class="btn btn-danger w-100" onclick="quarantineSample(event)">
            <i class="fas fa-lock"></i> Quarantine This Sample
          </button>
        `;
        showToast('⚠️ High-risk ransomware detected!', 'danger');
      } else {
        showToast(`✓ Prediction: ${prediction.prediction_label}`, 'info');
      }

      mitigationArea.innerHTML = html;
      // Store prediction for mitigation
      window.currentPrediction = { rowData, prediction };
    } else {
      showToast('Prediction error', 'danger');
      predOutEl.innerHTML = `<pre>${JSON.stringify(prediction, null, 2)}</pre>`;
    }
  } catch (e) {
    console.error('Error making prediction:', e);
    showToast('Prediction error: ' + e.message, 'danger');
    document.getElementById('predOut').innerHTML = `<pre style="color: #dc2626;">Error: ${e.message}</pre>`;
  }
}

// ============ QUARANTINE ============

async function quarantineSample(event) {
  event.preventDefault();

  try {
    if (!window.currentPrediction) {
      showToast('No prediction to quarantine', 'warning');
      return;
    }

    const { rowData, prediction } = window.currentPrediction;
    const btn = event.target;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Quarantining...';

    const response = await fetch('/api/mitigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row: rowData, result: prediction })
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`✓ Sample quarantined: ${result.file}`, 'success');
      const notifStatus = Object.entries(result.notifications || {})
        .map(([k, v]) => `${k}: ${v.status || 'unknown'}`)
        .join(' | ');
      
      btn.innerHTML = `<i class="fas fa-check"></i> Quarantined`;
      const mitigationArea = document.getElementById('mitigationArea');
      mitigationArea.insertAdjacentHTML('beforeend', `
        <div class="alert alert-success mt-2">
          <i class="fas fa-check-circle"></i> <strong>Quarantined:</strong> ${result.file}<br>
          <small>Notifications: ${notifStatus}</small>
        </div>
      `);
    } else {
      showToast('Quarantine failed', 'danger');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock"></i> Quarantine This Sample';
    }
  } catch (e) {
    console.error('Error quarantining sample:', e);
    showToast('Quarantine error: ' + e.message, 'danger');
    event.target.disabled = false;
  }
}

// ============ FILE UPLOAD ============

async function handleFileUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    showToast('Please select a file', 'warning');
    return;
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('Please upload a CSV file', 'danger');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`✓ File uploaded: ${file.name}`, 'success');
      fileInput.value = '';
      await refreshDashboard();
    } else {
      showToast('Upload failed', 'danger');
    }
  } catch (e) {
    console.error('Error uploading file:', e);
    showToast('Upload error: ' + e.message, 'danger');
  }
}

// ============ REFRESH DASHBOARD ============

async function refreshDashboard() {
  try {
    // Fetch stats
    const stats = await fetchStats();
    if (stats) {
      // Update class chart
      const chartCanvas = document.getElementById('classChart');
      if (chartCanvas && stats.class_counts) {
        drawClassChart(chartCanvas, stats.class_counts);
      }

      // Update stats display
      const statsPre = document.getElementById('statsPre');
      if (statsPre && stats.head) {
        statsPre.innerHTML = `<pre>${JSON.stringify(stats.head, null, 2)}</pre>`;
      }
    }

    // Fetch metrics
    const metrics = await fetchMetrics();
    if (metrics) {
      const metricsPre = document.getElementById('metricsPre');
      if (metricsPre) {
        const display = {
          accuracy: formatPercent(metrics.accuracy),
          precision_ransomware: formatPercent(metrics.report['0']?.precision),
          recall_ransomware: formatPercent(metrics.report['0']?.recall),
          f1_ransomware: formatPercent(metrics.report['0']?.['f1-score']),
          support_ransomware: metrics.report['0']?.support
        };
        metricsPre.innerHTML = `<pre>${JSON.stringify(display, null, 2)}</pre>`;
      }

      // Update accuracy badge
      const accBadge = document.getElementById('accBadge');
      if (accBadge) {
        accBadge.innerHTML = formatPercent(metrics.accuracy);
      }
    }
  } catch (e) {
    console.error('Error refreshing dashboard:', e);
  }
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 RanDetect Dashboard initializing...');

  // Event listeners
  document.getElementById('trainBtn')?.addEventListener('click', trainModel);
  document.getElementById('predictForm')?.addEventListener('submit', makePrediction);
  document.getElementById('uploadForm')?.addEventListener('submit', handleFileUpload);
  document.getElementById('randomBtn')?.addEventListener('click', generateRandomRow);

  // Initial load
  await refreshDashboard();
  showToast('✓ Dashboard ready', 'success');
});

// Auto-refresh every 30 seconds
setInterval(() => {
  refreshDashboard().catch(e => console.error('Auto-refresh error:', e));
}, 30000);

