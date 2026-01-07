from flask import Flask, render_template, request, jsonify
import os
from model import train_model, load_model, predict_row, dataset_stats
from notifier import notify_mitigation
import json
from datetime import datetime



app = Flask(__name__)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.joblib')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data_file.csv')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/train', methods=['POST'])
def api_train():
    res = train_model(data_path=DATA_PATH, model_path=MODEL_PATH)
    return jsonify(res)


@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.json
    if not data:
        return jsonify({'error': 'no input provided'}), 400
    model = load_model(MODEL_PATH)
    pred = predict_row(model, data)
    return jsonify(pred)


@app.route('/api/metrics', methods=['GET'])
def api_metrics():
    metrics_path = os.path.splitext(MODEL_PATH)[0] + '_metrics.json'
    if not os.path.exists(metrics_path):
        return jsonify({'error': 'metrics not found'}), 404
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)
    return jsonify(metrics)


@app.route('/api/upload', methods=['POST'])
def api_upload():
    # accept a CSV file upload to replace dataset
    if 'file' not in request.files:
        return jsonify({'error': 'no file part'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'no selected file'}), 400
    dest = DATA_PATH
    f.save(dest)
    return jsonify({'status': 'uploaded', 'path': dest})


@app.route('/api/mitigate', methods=['POST'])
def api_mitigate():
    # Simulated mitigation: write a quarantine record and append to a log.
    payload = request.json
    if not payload:
        return jsonify({'error': 'no payload provided'}), 400
    row = payload.get('row') or payload.get('data') or payload
    result = payload.get('result') or {}
    quarantine_dir = os.path.join(os.path.dirname(__file__), 'quarantine')
    os.makedirs(quarantine_dir, exist_ok=True)
    ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    fname = f"quarantine_{ts}.json"
    path = os.path.join(quarantine_dir, fname)
    record = {'row': row, 'result': result, 'timestamp': ts, 'file': fname}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(record, f, default=str)
    log_path = os.path.join(quarantine_dir, 'mitigation.log')
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{ts} mitigated: {fname}\n")

    # send notifications (webhook / slack / email) if configured
    try:
        notify_results = notify_mitigation({'row': row, 'result': result, 'timestamp': ts, 'file': path})
    except Exception as e:
        notify_results = {'error': str(e)}

    # append notification result to log
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{ts} notifications: {json.dumps(notify_results, ensure_ascii=False)}\n")

    return jsonify({'status': 'mitigated', 'file': path, 'notifications': notify_results})


@app.route('/api/stats', methods=['GET'])
def api_stats():
    stats = dataset_stats(DATA_PATH)
    return jsonify(stats)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
