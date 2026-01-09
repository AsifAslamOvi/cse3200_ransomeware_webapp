# User Guide & Getting Started

## Table of Contents
1. [Installation](#installation)
2. [Dashboard Overview](#dashboard-overview)
3. [Making Predictions](#making-predictions)
4. [Training the Model](#training-the-model)
5. [Uploading Data](#uploading-data)
6. [API Usage Examples](#api-usage-examples)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites
- Python 3.8 or higher
- 4 GB RAM minimum
- 500 MB disk space

### Step-by-Step Setup (Windows)

#### 1. Open PowerShell
```powershell
# Navigate to project directory
cd "F:\3200 project\ransomware-webapp_with_model"
```

#### 2. Create Virtual Environment
```powershell
python -m venv .venv
```

#### 3. Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```
*Your prompt should now show `(.venv)` prefix*

#### 4. Install Dependencies
```powershell
pip install -r requirements.txt
```
Expected output: ✓ Successfully installed flask, scikit-learn, pandas, joblib...

#### 5. Verify Model Exists (Optional)
```powershell
if (Test-Path "model.joblib") {
    Write-Host "✓ Model found: model.joblib"
} else {
    Write-Host "⚠ No model found. Run: python train_model.py"
}
```

#### 6. Start Application
```powershell
python app.py
```

Expected output:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

#### 7. Open in Browser
```powershell
Start-Process "http://localhost:5000"
```

---

## Dashboard Overview

### Main Interface Layout

```
╔═══════════════════════════════════════════════════════════════════╗
║           Ransomware Detection & Mitigation Dashboard             ║
║             [TRAIN MODEL Button]  Accuracy: [badge: 99.6%]       ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────────────────┐   ┌──────────────────────────────────┐  ║
║  │ Upload Dataset       │   │ Dataset & Metrics               │  ║
║  ├──────────────────────┤   ├──────────────────────────────────┤  ║
║  │ [Choose CSV file]    │   │ Top rows:              Metrics:  │  ║
║  │ [Upload CSV]         │   │ ┌─────────────────┐ ┌────────┐  │  ║
║  │                      │   │ │FileName | md5  │ │Accuracy│  │  ║
║  │ Class Distribution   │   │ │─────────────────│ │ 99.62% │  │  ║
║  │ [Pie Chart]          │   │ │ file_0124 | 797 │ │Precisio│  │  ║
║  │ ■ Benign: 43.4%     │   │ │ file_05c8 | 95e  │ │ 99.63% │  │  ║
║  │ ■ Ransomware: 56.6% │   │ │ file_0605 | 85c  │ └────────┘  │  ║
║  │                      │   │ └─────────────────┘              │  ║
║  └──────────────────────┘   └──────────────────────────────────┘  ║
║                                                                    ║
║  ┌───────────────────────────────────────────────────────────┐   ║
║  │ Predict Row                                               │   ║
║  ├───────────────────────────────────────────────────────────┤   ║
║  │ Provide numeric fields as JSON (only numeric used)        │   ║
║  │ ┌─────────────────────────────────────────────────────┐   │   ║
║  │ │ {                                                   │   │   ║
║  │ │   "DebugSize": 0,                                   │   │   ║
║  │ │   "DebugRVA": 0,                                    │   │   ║
║  │ │   "MajorImageVersion": 0,                           │   │   ║
║  │ │   ...                                               │   │   ║
║  │ │ }                                                   │   │   ║
║  │ └─────────────────────────────────────────────────────┘   │   ║
║  │ [Predict] [Generate Random Row]                         │   ║
║  │                                                           │   ║
║  │ Prediction Result:                                        │   ║
║  │ ┌─────────────────────────────────────────────────────┐   │   ║
║  │ │ {                                                   │   │   ║
║  │ │   "prediction_label": "Benign",                     │   │   ║
║  │ │   "confidence": "99%",                              │   │   ║
║  │ │   "risk_level": "Low",                              │   │   ║
║  │ │   "probabilities": {...}                            │   │   ║
║  │ │ }                                                   │   │   ║
║  │ └─────────────────────────────────────────────────────┘   │   ║
║  └───────────────────────────────────────────────────────────┘   ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Key UI Elements

#### Train Model Button (Top Right)
- **Purpose:** Retrain ML model on current data_file.csv
- **Result:** Updates model.joblib and metrics display
- **Time:** ~30-60 seconds for 62K samples
- **Feedback:** Status message appears below button

#### Class Distribution Chart (Left Panel)
- **Type:** Pie chart (using Chart.js)
- **Shows:** Ratio of Benign vs Ransomware in dataset
- **Colors:** Blue (Benign), Red (Ransomware)
- **Updates:** Refreshes after CSV upload or model train

#### Prediction Form (Bottom)
- **Input:** JSON object with numeric feature values
- **Output:** Prediction label + confidence + risk level
- **Features:** "Generate Random Row" button for testing
- **Buttons:** 
  - "Predict" - Submit for inference
  - "Generate Random Row" - Fill with random values
  - (After prediction) "Mitigate" - Quarantine if High Risk

---

## Making Predictions

### Method 1: Using Dashboard

#### Step 1: Populate Features
Click "Generate Random Row" button:
```json
{
  "DebugSize": 84,
  "DebugRVA": 121728,
  "MajorImageVersion": 10,
  "MajorOSVersion": 10,
  "ExportRVA": 126576,
  "ExportSize": 4930,
  "IatVRA": 0,
  "MajorLinkerVersion": 14,
  "MinorLinkerVersion": 10,
  "NumberOfSections": 8,
  "SizeOfStackReserve": 262144,
  "DllCharacteristics": 16864,
  "ResourceSize": 1024,
  "BitcoinAddresses": 0
}
```

#### Step 2: Click Predict
System sends JSON to `/api/predict` endpoint

#### Step 3: Review Result
```
Prediction Result:

{
  "prediction_label": "Benign",
  "prediction_code": 1,
  "confidence": "99%",
  "risk_level": "Low",
  "probabilities": {
    "ransomware": 0.004,
    "benign": 0.996
  },
  "description": "No ransomware-like behavior detected; sample judged benign."
}
```

#### Step 4: Take Action (if High Risk)
If prediction shows "Ransomware" with High Risk:
1. Review the probabilities
2. Click "Mitigate" button
3. System quarantines the sample
4. Notifications sent to configured channels

---

### Method 2: Using cURL (Command Line)

#### Basic Prediction Request
```bash
curl -X POST http://localhost:5000/api/predict `
  -H "Content-Type: application/json" `
  -d '{
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
  }'
```

#### Response
```json
{
  "prediction_label": "Benign",
  "confidence": "99%",
  "risk_level": "Low",
  "probabilities": {
    "ransomware": 0.004,
    "benign": 0.996
  },
  "description": "No ransomware-like behavior detected; sample judged benign."
}
```

---

### Method 3: Using Python

```python
import requests
import json

# Endpoint
API_URL = "http://localhost:5000/api/predict"

# Feature vector
sample = {
    "DebugSize": 100,
    "DebugRVA": 50000,
    "MajorImageVersion": 10,
    "MajorOSVersion": 10,
    "ExportRVA": 100000,
    "ExportSize": 5000,
    "IatVRA": 10000,
    "MajorLinkerVersion": 14,
    "MinorLinkerVersion": 10,
    "NumberOfSections": 6,
    "SizeOfStackReserve": 1048576,
    "DllCharacteristics": 16864,
    "ResourceSize": 2000,
    "BitcoinAddresses": 1  # ← Suspicious!
}

# Make request
response = requests.post(API_URL, json=sample, timeout=5)
prediction = response.json()

# Display results
print(f"Label: {prediction['prediction_label']}")
print(f"Risk: {prediction['risk_level']}")
print(f"Confidence: {prediction['confidence']}")
print(f"Ransomware Probability: {prediction['probabilities']['ransomware']:.2%}")

# Auto-quarantine if high risk
if prediction['risk_level'] == 'High':
    mitigation_response = requests.post(
        "http://localhost:5000/api/mitigate",
        json={
            "row": sample,
            "result": prediction
        }
    )
    print(f"Quarantined: {mitigation_response.json()['file']}")
```

---

## Training the Model

### Manual Training (Dashboard)

1. **Ensure CSV is in place:**
   - File: `data_file.csv`
   - Columns: Must include "Benign" column (0=Ransomware, 1=Benign)

2. **Click "Train Model" button**
   - Status appears: "Training..."
   - Wait for completion (~30-60 sec)
   - Status updates: "✓ Training complete"
   - Accuracy badge updates

3. **Review Metrics**
   - "Latest model metrics" panel shows:
     - Accuracy: 99.62%
     - Precision: 99.63%
     - Recall: 99.70%
     - F1-Score: 99.68%

### Command Line Training

```powershell
# Activate environment first
.\.venv\Scripts\Activate.ps1

# Run training script
python train_model.py

# Output:
# {'accuracy': 0.996239, 'report': {...}}
```

### What Happens During Training

```
Training Pipeline:
├─ Load CSV (62,487 samples)
├─ Feature Selection (14 numeric columns)
├─ Train-Test Split (80/20 with stratification)
├─ Train RandomForest (100 trees)
├─ Generate predictions on test set
├─ Calculate metrics (accuracy, precision, recall, F1)
├─ Save model.joblib (binary artifact)
├─ Save model_metrics.json (evaluation results)
└─ Display results
```

### Expected Output

```json
{
  "accuracy": 0.996239097383372,
  "report": {
    "0": {
      "precision": 0.9963266459451823,
      "recall": 0.9970309628163438,
      "f1-score": 0.9966786799519469,
      "support": 7073.0
    },
    "1": {
      "precision": 0.9961247462631482,
      "recall": 0.9952064896755162,
      "f1-score": 0.995665406252882,
      "support": 5424.0
    }
  }
}
```

---

## Uploading Data

### Using Dashboard

1. **Click "Upload Dataset" panel (left sidebar)**

2. **Click "Choose File" button**
   - Browse to your CSV file
   - Requirements:
     - Format: CSV
     - Must have "Benign" column (1=Benign, 0=Ransomware)
     - Numeric feature columns

3. **Click "Upload CSV" button**
   - Uploads file to server
   - Replaces `data_file.csv`
   - Optionally trigger retraining

4. **Dataset metrics update**
   - Class distribution chart updates
   - Statistics panel refreshes

### Using cURL

```bash
curl -X POST http://localhost:5000/api/upload `
  -F "file=@C:\path\to\my_dataset.csv"
```

### CSV Format Requirements

```csv
FileName,md5Hash,Machine,DebugSize,DebugRVA,MajorImageVersion,MajorOSVersion,ExportRVA,ExportSize,IatVRA,MajorLinkerVersion,MinorLinkerVersion,NumberOfSections,SizeOfStackReserve,DllCharacteristics,ResourceSize,BitcoinAddresses,Benign
file1.dll,abc123...,machine1,0,0,0,4,0,0,8192,8,0,3,1048576,34112,672,0,1
file2.dll,def456...,machine2,84,121728,10,10,126576,4930,0,14,10,8,262144,16864,1024,0,1
file3.dll,ghi789...,machine3,0,0,0,4,0,0,8192,8,0,3,1048576,34112,672,1,0
```

**Notes:**
- Benign column: 1 = Benign file, 0 = Ransomware
- Numeric columns: Must be numeric (int or float)
- Missing values: Will be filled with 0 during processing

---

## API Usage Examples

### Complete Python Workflow

```python
#!/usr/bin/env python3
"""
Complete ransomware detection workflow using the API
"""

import requests
import json
import pandas as pd
from datetime import datetime

BASE_URL = "http://localhost:5000"
API = {
    "predict": f"{BASE_URL}/api/predict",
    "train": f"{BASE_URL}/api/train",
    "metrics": f"{BASE_URL}/api/metrics",
    "stats": f"{BASE_URL}/api/stats",
    "mitigate": f"{BASE_URL}/api/mitigate",
    "upload": f"{BASE_URL}/api/upload"
}

# 1. Get current metrics
print("[1] Fetching model metrics...")
metrics = requests.get(API["metrics"]).json()
print(f"   Model Accuracy: {metrics['accuracy']:.2%}")

# 2. Get dataset statistics
print("\n[2] Fetching dataset statistics...")
stats = requests.get(API["stats"]).json()
print(f"   Dataset shape: {stats['shape']}")
print(f"   Class distribution: {stats['class_counts']}")

# 3. Make predictions on multiple samples
print("\n[3] Making predictions...")
samples = [
    {"DebugSize": 0, "DebugRVA": 0, "MajorImageVersion": 0, "MajorOSVersion": 4, "ExportRVA": 0, "ExportSize": 0, "IatVRA": 8192, "MajorLinkerVersion": 8, "MinorLinkerVersion": 0, "NumberOfSections": 3, "SizeOfStackReserve": 1048576, "DllCharacteristics": 34112, "ResourceSize": 672, "BitcoinAddresses": 0},
    {"DebugSize": 100, "DebugRVA": 50000, "MajorImageVersion": 10, "MajorOSVersion": 10, "ExportRVA": 100000, "ExportSize": 5000, "IatVRA": 10000, "MajorLinkerVersion": 14, "MinorLinkerVersion": 10, "NumberOfSections": 6, "SizeOfStackReserve": 1048576, "DllCharacteristics": 16864, "ResourceSize": 2000, "BitcoinAddresses": 1},
]

predictions = []
for i, sample in enumerate(samples, 1):
    response = requests.post(API["predict"], json=sample)
    pred = response.json()
    predictions.append(pred)
    print(f"   Sample {i}: {pred['prediction_label']} (Risk: {pred['risk_level']}, Confidence: {pred['confidence']})")

# 4. Quarantine high-risk items
print("\n[4] Quarantining high-risk samples...")
for i, (sample, pred) in enumerate(zip(samples, predictions), 1):
    if pred['risk_level'] == 'High':
        response = requests.post(API["mitigate"], json={"row": sample, "result": pred})
        result = response.json()
        print(f"   Sample {i} quarantined: {result['file']}")

# 5. Save results to file
print("\n[5] Saving results...")
with open("prediction_results.json", "w") as f:
    json.dump({
        "timestamp": datetime.now().isoformat(),
        "metrics": metrics,
        "predictions": predictions
    }, f, indent=2)
print("    Results saved to prediction_results.json")
```

### Batch Prediction from CSV

```python
import pandas as pd
import requests

# Load test data
df = pd.read_csv("test_samples.csv")

# Make predictions
results = []
for idx, row in df.iterrows():
    features = row.drop('Benign').to_dict()
    response = requests.post("http://localhost:5000/api/predict", json=features)
    pred = response.json()
    
    results.append({
        'index': idx,
        'actual': row['Benign'],
        'predicted': pred['prediction_code'],
        'confidence': pred['confidence'],
        'risk_level': pred['risk_level']
    })

# Calculate accuracy
correct = sum(1 for r in results if r['actual'] == r['predicted'])
accuracy = correct / len(results) * 100
print(f"Batch Accuracy: {accuracy:.2f}%")

# Save results
pd.DataFrame(results).to_csv("batch_results.csv", index=False)
```

---

## Troubleshooting

### Issue: "Port 5000 already in use"

**Problem:** Another application is using port 5000

**Solution:**
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
taskkill /PID <PID> /F

# Or start on different port
$env:FLASK_PORT=5001
python app.py
# Then access: http://localhost:5001
```

### Issue: "Model not found. Train first via /api/train"

**Problem:** model.joblib doesn't exist

**Solution:**
```powershell
# Train the model
python train_model.py
# Or use dashboard: click "Train Model" button
```

### Issue: "Target column `Benign` not found in CSV"

**Problem:** CSV file doesn't have required "Benign" column

**Solution:**
1. Verify CSV has "Benign" column
2. Column must be binary (0 or 1)
3. 1 = Benign file, 0 = Ransomware

### Issue: Predictions always return same result

**Problem:** Model not trained on valid data

**Solution:**
```powershell
# Verify data_file.csv exists and has content
Get-Item data_file.csv

# Retrain model
python train_model.py

# Check metrics
curl http://localhost:5000/api/metrics
```

### Issue: Notifications not sending

**Problem:** Environment variables not configured

**Solution:**
```powershell
# Create .env file with:
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587

# Restart Flask app
python app.py
```

### Issue: "Connection refused" when accessing localhost:5000

**Problem:** Flask app not running

**Solution:**
```powershell
# Start Flask
python app.py

# Verify it's running
curl http://localhost:5000

# Wait ~2-3 seconds for startup
Start-Sleep -Seconds 3
Start-Process "http://localhost:5000"
```

