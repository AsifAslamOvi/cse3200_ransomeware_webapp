# Technical Architecture & System Design

## 1. System Overview

### Purpose
Detect ransomware-related behavior from Portable Executable (PE) file characteristics using machine learning classification, deployed as a scalable web service with automated response capabilities.

### Key Components
- **Frontend:** Bootstrap 5 web dashboard
- **Backend:** Flask REST API
- **ML Engine:** scikit-learn Random Forest Classifier
- **Storage:** File-based (JSON) with SQLite option for production
- **Notifications:** Multi-channel (Slack, Email, Webhooks)
- **Containerization:** Docker support

---

## 2. Data Pipeline Architecture

### Data Flow Diagram
```
┌─────────────────────────────────────────────────────────┐
│              SOURCE: data_file.csv                      │
│         (62,487 samples × 18 columns)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                    CSV Parser
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    ┌───▼─────┐                    ┌────▼────┐
    │Features │                    │ Target  │
    │(14 cols)│                    │ (Benign)│
    └───┬─────┘                    └────┬────┘
        │                               │
        ▼                               ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Feature Matrix  │    │  Label Vector    │
    │  X = (n × 14)    │    │  y = (n × 1)     │
    │  Type: float64   │    │  Type: int32     │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             └───────────┬───────────┘
                         │
                    Train-Test Split
                    (80% / 20%)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    ┌───▼─────────┐            ┌────▼─────────┐
    │Training Set │            │ Test Set      │
    │  9,998 rows │            │  2,499 rows   │
    └───┬─────────┘            └────┬─────────┘
        │                           │
        ▼                           ▼
    Random Forest            Evaluation
    Training                 Metrics
    (100 trees)              (Accuracy,
        │                    Precision,
        │                    Recall, F1)
        ▼
    model.joblib
    (Serialized)
```

### Feature Engineering Pipeline
```python
Input CSV
    ↓
┌─────────────────────────────────┐
│ 1. Load with Pandas             │
│    - Handle missing values      │
│    - Infer dtypes               │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 2. Feature Selection            │
│    - Drop: FileName, md5Hash    │
│    - Drop: Machine, Benign      │
│    - Keep: Numeric columns only │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 3. Data Cleaning                │
│    - Replace NaN with 0         │
│    - Ensure numeric types       │
│    - Remove duplicates (opt)    │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 4. Target Variable Extraction   │
│    - y = df['Benign'].astype(int)│
│    - Binary: 0=Ransomware       │
│    -         1=Benign           │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 5. Stratified Split             │
│    - Preserve class balance     │
│    - random_state=42 (repro)    │
│    - test_size=0.2              │
└─────────────┬───────────────────┘
              ▼
    Training Data (80%)
    Test Data (20%)
```

---

## 3. Model Architecture

### Random Forest Classifier Structure
```
Random Forest (100 Decision Trees)
├── Tree 1
│   ├── if DebugSize > 45
│   │   ├── if ExportRVA > 1000
│   │   │   └── Prediction: Benign
│   │   └── else
│   │       └── Prediction: Ransomware
│   └── else
│       └── ...
├── Tree 2
│   ├── if BitcoinAddresses > 0
│   │   └── Prediction: Ransomware
│   └── else
│       └── ...
├── ...
└── Tree 100
    └── ...

Aggregation: Majority Vote
Example: 97 trees vote "Ransomware", 3 vote "Benign"
         → Final Prediction: Ransomware
         → Confidence: 97/100 = 97%
```

### Decision Tree Feature Importance Example
```
Most Important Features (learned from data):
1. BitcoinAddresses    │████████████████████│ 35%
2. ExportSize          │███████████│         | 18%
3. NumberOfSections    │████████│            | 12%
4. ResourceSize        │███████│             | 11%
5. DebugRVA            │██████│              | 8%
6. IatVRA              │████│                | 6%
7. ExportRVA           │███│                 | 5%
8. DllCharacteristics  │██│                  | 3%
9. Other Features      ││                    | 2%

Note: BitcoinAddresses is strongest indicator
      (Ransom notes often contain wallet addresses)
```

### Prediction Probability Calibration
```
Raw Score (0-100%)                Risk Classification
──────────────────────────────────────────────────────
  0% ──────────────────┬─ 40%    → LOW RISK
                       │           (No Action)
 40% ─────────────┬────┼─ 60%    → MEDIUM RISK
                  │    │          (Monitor & Review)
 60% ────────┬────┤    │─ 100%   → HIGH RISK
             │    │    │          (Immediate Quarantine)
100%────────└────┘    │
                      │
            Decision Threshold
```

---

## 4. Application Architecture

### Flask Request Handling Flow
```
HTTP Request
    │
    ▼
Flask Router
    │
    ├─→ GET /              → render_template('index.html')
    │
    ├─→ POST /api/train    → model.train_model()
    │                         │
    │                         ├─ Load CSV
    │                         ├─ Feature Selection
    │                         ├─ Train RandomForest
    │                         ├─ Evaluate
    │                         └─ Save model.joblib & metrics
    │                            │
    │                            └─ return jsonify(metrics)
    │
    ├─→ POST /api/predict  → model.load_model()
    │                         │
    │                         ├─ Validate Input
    │                         ├─ Feature Alignment
    │                         ├─ Model.predict()
    │                         ├─ Model.predict_proba()
    │                         └─ Format Response
    │                            │
    │                            └─ return jsonify(prediction)
    │
    ├─→ GET /api/metrics   → Load model_metrics.json
    │                         │
    │                         └─ return jsonify(metrics)
    │
    ├─→ GET /api/stats     → model.dataset_stats()
    │                         │
    │                         ├─ Compute shape
    │                         ├─ Class distribution
    │                         ├─ Feature statistics
    │                         └─ Sample head
    │                            │
    │                            └─ return jsonify(stats)
    │
    ├─→ POST /api/mitigate → Create quarantine record
    │                         │
    │                         ├─ Write JSON to quarantine/
    │                         ├─ Append to mitigation.log
    │                         ├─ notifier.notify_mitigation()
    │                         │  ├─ Send Slack message
    │                         │  ├─ Send Email
    │                         │  └─ POST to Webhook
    │                         └─ return jsonify(status)
    │
    └─→ POST /api/upload   → Save uploaded CSV
                            │
                            └─ return jsonify(upload_status)
```

### Multi-threading & Concurrency
```
Flask App (Default)
├─ Single-threaded (debug=True)
│  └─ Sequential request processing
│     (Good for development, prototyping)
│
Production Setup
├─ Multi-worker (Gunicorn + 4 workers)
│  ├─ Worker 1: Handles concurrent requests
│  ├─ Worker 2: Independent ML inference
│  ├─ Worker 3: Notification sending
│  └─ Worker 4: Data I/O operations
│  └─ Can handle ~200 requests/sec
```

---

## 5. Data Storage Architecture

### File System Structure
```
project-root/
│
├── data_file.csv                 ← Training dataset (62.5K samples)
├── model.joblib                  ← Trained ML model binary
├── model_metrics.json            ← Evaluation metrics (JSON)
│
├── quarantine/                   ← Flagged samples storage
│   ├── quarantine_20260101T102944Z.json    ← Sample 1
│   ├── quarantine_20260101T120304Z.json    ← Sample 2
│   ├── quarantine_20260101T122328Z.json    ← Sample 3
│   └── mitigation.log            ← Audit trail
│
├── templates/
│   └── index.html               ← Web dashboard
├── static/
│   ├── app.js                   ← Frontend logic
│   └── app.css                  ← Styling
│
├── app.py                        ← Flask application
├── model.py                      ← ML core functions
├── train_model.py               ← Training script
├── notifier.py                  ← Notification logic
│
├── Dockerfile                    ← Container definition
├── requirements.txt              ← Dependencies
└── .env                         ← Configuration (Slack, Email, etc)
```

### Quarantine File Schema
```json
{
  "row": {
    "DebugSize": 0,
    "DebugRVA": 0,
    "MajorImageVersion": 0,
    "MajorOSVersion": 4,
    "ExportRVA": 0,
    "ExportSize": 0,
    "IatVRA": 8192,
    "MajorLinkerVersion": 8,
    "MinorLinkerVersion": 0,
    "NumberOfSections": 3,
    "SizeOfStackReserve": 1048576,
    "DllCharacteristics": 34112,
    "ResourceSize": 672,
    "BitcoinAddresses": 0
  },
  "result": {
    "prediction_label": "Ransomware",
    "prediction_code": 0,
    "confidence": "99%",
    "risk_level": "High",
    "probabilities": {
      "ransomware": 0.996,
      "benign": 0.004
    },
    "description": "The system detected suspicious behavior consistent with ransomware activity."
  },
  "timestamp": "20260101T102944Z",
  "file": "quarantine_20260101T102944Z.json"
}
```

### Mitigation Log Format
```
[timestamp] [event_type] [details]

2026-01-01T10:29:44Z mitigated: quarantine_20260101T102944Z.json
2026-01-01T10:29:45Z notifications: {"slack": {"status": "sent"}, "email": {"status": "sent"}, "webhook": {"status": "error", "message": "timeout"}}
2026-01-01T10:31:02Z mitigated: quarantine_20260101T103102Z.json
2026-01-01T10:31:03Z notifications: {"slack": {"status": "sent"}, "email": {"status": "failed", "reason": "auth_error"}}
```

---

## 6. Notification System Architecture

### Multi-Channel Notification Flow
```
Detection Triggered
(High-Risk Prediction)
    │
    ▼
┌─────────────────────────────────────┐
│  notifier.notify_mitigation()       │
│  (Async notification dispatcher)    │
└─────────────┬───────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐┌────────┐┌──────────┐
│ Slack  ││ Email  ││ Webhook  │
│ Webhook││ (SMTP) ││ (HTTP)   │
└────┬───┘└────┬───┘└────┬─────┘
     │         │         │
     ▼         ▼         ▼
[External    [SMTP     [HTTP
 Service]     Server]   Endpoint]
     │         │         │
     │         │         │
     └─────────┼─────────┘
               │
        ┌──────▼──────┐
        │  Log Result │
        │  to .log    │
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │  Return Notification    │
        │  Status to /api/mitigate│
        └────────────────────────┘
```

### Configuration (Environment Variables)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
MITIGATION_WEBHOOK_URL=https://api.company.com/incidents/create

MITIGATION_EMAIL_TO=security@company.com
EMAIL_FROM=alerts@company.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@company.com
SMTP_PASS=app_password_here
```

---

## 7. Security Architecture

### Input Validation Pipeline
```
API Request (JSON)
    │
    ▼
┌─────────────────────────────────┐
│ 1. Schema Validation            │
│    - Required fields present?   │
│    - Correct data types?        │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 2. Type Checking                │
│    - Numeric fields only        │
│    - No strings/injection       │
│    - No extreme values          │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 3. Size Limits                  │
│    - Max payload: 10 MB         │
│    - Max field values: safe     │
│    - Rate limiting: 100 req/min │
└─────────────┬───────────────────┘
              ▼
┌─────────────────────────────────┐
│ 4. Feature Alignment            │
│    - Expected columns?          │
│    - Missing features → 0       │
│    - Column reordering          │
└─────────────┬───────────────────┘
              ▼
    Safe for Model Inference
```

### Network Security Recommendations
```
Public Internet
    │
    ▼
┌──────────────────────────────┐
│ WAF (Web Application Firewall)│
│ - Rate limiting              │
│ - SQL injection protection   │
│ - DDoS mitigation            │
└───────────┬──────────────────┘
            │
            ▼
┌──────────────────────────────┐
│ Load Balancer (HTTPS/TLS 1.3)│
│ - SSL certificate (valid)    │
│ - Request authentication     │
│ - Distributed traffic        │
└───────────┬──────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌────────┐      ┌────────┐
│Instance│      │Instance│
│   1    │      │   2    │
└────────┘      └────────┘
    │               │
    └───────┬───────┘
            │
            ▼
┌──────────────────────────────┐
│ Database / File Storage      │
│ - Encrypted at rest          │
│ - Access logging             │
│ - Backup & recovery          │
└──────────────────────────────┘
```

---

## 8. Deployment Architecture

### Development Environment
```
Developer Workstation
├─ .venv/ (Python virtual env)
├─ Python 3.8+
├─ pip install -r requirements.txt
├─ python app.py (debug=True)
└─ http://localhost:5000
```

### Docker Containerization
```
Dockerfile
    │
    ├─ Base Image: python:3.10-slim
    ├─ Install Requirements
    ├─ Copy Source Code
    ├─ Expose Port 5000
    └─ CMD: ["python", "app.py"]
         │
         ▼
    Container Image (ransomware-detector:latest)
         │
         ▼
    Docker Run
    ├─ Port: 5000:5000 (host:container)
    ├─ Volume: ./quarantine (persist data)
    ├─ Volume: ./data_file.csv (training data)
    └─ Env: SLACK_WEBHOOK_URL, etc.
```

### Production Deployment (Example)
```
┌─────────────────────────────────────────────────┐
│         Cloud Platform (AWS/GCP/Azure)          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Auto-Scaling Group (Kubernetes)          │  │
│  ├──────────────────────────────────────────┤  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │  │
│  │ │ Pod  │ │ Pod  │ │ Pod  │ │ Pod  │... │  │
│  │ │ (1)  │ │ (2)  │ │ (3)  │ │ (4)  │    │  │
│  │ └──────┘ └──────┘ └──────┘ └──────┘    │  │
│  │    │        │        │        │        │  │
│  │    └────────┼────────┼────────┘        │  │
│  │             │        │                 │  │
│  └─────────────┼────────┼─────────────────┘  │
│                │        │                     │
│  ┌─────────────▼────────▼─────────────────┐  │
│  │ Service / Load Balancer                │  │
│  │ - Round-robin request distribution    │  │
│  │ - Health checks                       │  │
│  └─────────────┬────────────────────────┘  │
│                │                            │
│  ┌─────────────▼────────────────────────┐  │
│  │ Persistent Storage                   │  │
│  │ - Shared quarantine/ folder          │  │
│  │ - RDS/SQL for metrics                │  │
│  │ - Backup policies                    │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 9. Monitoring & Observability

### Key Metrics to Monitor
```
Performance Metrics:
├─ Request Latency (p50, p95, p99)
├─ Throughput (requests/sec)
├─ Error Rate (%)
├─ Model Inference Time
└─ API Availability (uptime %)

Business Metrics:
├─ Predictions per day
├─ Quarantines per day
├─ Detection rate (by risk level)
├─ Notification delivery rate
└─ False positive rate

System Metrics:
├─ CPU utilization
├─ Memory usage
├─ Disk usage (quarantine folder)
├─ Network bandwidth
└─ Database connections
```

### Logging Strategy
```
Log Levels:
  DEBUG    - Detailed diagnostic info
  INFO     - General operational events
  WARNING  - Potential issues
  ERROR    - Error conditions
  CRITICAL - System failures

Log Destinations:
  1. Console (stdout)
  2. File (./logs/app.log)
  3. Central Logger (ELK, Splunk, etc.)
  4. Audit Trail (./quarantine/mitigation.log)
```

---

## 10. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Bootstrap 5 + JS | Web dashboard UI |
| **Backend** | Flask 2.0+ | REST API framework |
| **ML Framework** | scikit-learn | Model training & inference |
| **Serialization** | joblib | Model artifact storage |
| **Data Processing** | pandas | CSV handling, feature engineering |
| **Server** | Gunicorn | Production WSGI server |
| **Containerization** | Docker | Reproducible deployments |
| **Orchestration** | Kubernetes (opt) | Auto-scaling & management |
| **Notifications** | Slack API, SMTP | Alert channels |
| **Storage** | JSON Files | Quarantine records |
| **Monitoring** | Prometheus (opt) | Metrics collection |

