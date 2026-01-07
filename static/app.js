async function fetchStats(){
  const r = await fetch('/api/stats');
  return r.json();
}

async function generateRandomRow(){
  const stats = await fetchStats();
  const means = stats.feature_means || {};
  const stds = stats.feature_stds || {};
  const obj = {};
  for(const k of Object.keys(means)){
    const mean = Number(means[k]) || 0;
    const std = Math.abs(Number(stds[k])) || 0;
    let val;
    if(std > 0){
      const u1 = Math.random() || 1e-9;
      const u2 = Math.random();
      const z = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
      val = Math.round(mean + z * std);
    } else {
      if(mean === 0){
        val = Math.round(Math.random() * 1000);
      } else {
        val = Math.round(mean * (0.5 + Math.random()));
      }
    }
    if(Number.isNaN(val) || val === null) val = Math.round(mean || 0);
    obj[k] = val;
  }
  document.getElementById('rowInput').value = JSON.stringify(obj, null, 2);
}

async function fetchMetrics(){
  const r = await fetch('/api/metrics');
  return r.ok ? r.json() : null;
}

function drawClassChart(ctx, counts){
  const labels = Object.keys(counts);
  const data = labels.map(k => counts[k]);
  if(window.classChart) window.classChart.destroy();
  window.classChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor:['#dc3545','#198754'] }] },
    options: { responsive: true }
  });
}

async function refreshDashboard(){
  const stats = await fetchStats();
  document.getElementById('statsPre').innerText = JSON.stringify(stats, null, 2);
  const metrics = await fetchMetrics();
  if(metrics){
    document.getElementById('metricsPre').innerText = JSON.stringify(metrics, null, 2);
    if(metrics.report && metrics.report['0']){
      document.getElementById('accBadge').innerText = (metrics.accuracy||0).toFixed(3);
    }
  }
  const counts = stats.class_counts || {};
  drawClassChart(document.getElementById('classChart'), counts);
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('trainBtn').addEventListener('click', async ()=>{
    document.getElementById('trainStatus').innerText = 'Training...';
    const r = await fetch('/api/train', {method:'POST'});
    const j = await r.json();
    document.getElementById('trainStatus').innerText = 'Done';
    refreshDashboard();
    document.getElementById('metricsPre').innerText = JSON.stringify(j, null, 2);
  });

  document.getElementById('uploadForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const f = document.getElementById('fileInput').files[0];
    if(!f) return alert('Select a file');
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', {method:'POST', body: fd});
    const j = await r.json();
    alert('Uploaded');
    refreshDashboard();
  });

  document.getElementById('randomBtn')?.addEventListener('click', async ()=>{
    document.getElementById('predOut').innerText = 'Generating...';
    await generateRandomRow();
    document.getElementById('predOut').innerText = '';
  });

  document.getElementById('predictForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    let v = document.getElementById('rowInput').value;
    let obj = {};
    try{ obj = JSON.parse(v); }catch(err){ document.getElementById('predOut').innerText = 'Invalid JSON'; return; }
    const r = await fetch('/api/predict', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj)});
    const j = await r.json();
    // show prediction
    document.getElementById('predOut').innerText = JSON.stringify(j, null, 2);
    // show mitigation control when risk is High
    const mitArea = document.getElementById('mitigationArea');
    mitArea.innerHTML = '';
    if(j && j.risk_level === 'High'){
      const btn = document.createElement('button');
      btn.className = 'btn btn-danger btn-sm';
      btn.innerText = 'Mitigate (Isolate)';
      btn.addEventListener('click', async ()=>{
        btn.disabled = true;
        btn.innerText = 'Mitigating...';
        const body = { row: obj, result: j };
        const res = await fetch('/api/mitigate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
        const jr = await res.json();
        document.getElementById('predOut').innerText = JSON.stringify({prediction: j, mitigation: jr}, null, 2);
        btn.innerText = 'Mitigated';
      });
      mitArea.appendChild(btn);
    }
  });

  refreshDashboard();
});
