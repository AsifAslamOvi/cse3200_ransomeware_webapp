# API Quick Reference Guide

## Endpoints Summary

### Dashboard
- `GET /` - Web UI dashboard

### Model Training
- `POST /api/train` - Retrain model on current dataset

### Predictions & Analysis
- `POST /api/predict` - Make ransomware prediction
- `GET /api/metrics` - Get model evaluation metrics
- `GET /api/stats` - Get dataset statistics

### Data Management
- `POST /api/upload` - Upload new CSV dataset
- `POST /api/mitigate` - Quarantine flagged sample & notify

---

## Quick Curl Examples

### Test Prediction
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
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

### Get Metrics
```bash
curl http://localhost:5000/api/metrics
```

### Get Stats
```bash
curl http://localhost:5000/api/stats
```

### Train Model
```bash
curl -X POST http://localhost:5000/api/train
```

---

## Response Format

### Prediction Response
```json
{
  "prediction_label": "Benign|Ransomware",
  "prediction_code": 0|1,
  "confidence": "XX%",
  "risk_level": "Low|Medium|High",
  "probabilities": {
    "ransomware": 0.0-1.0,
    "benign": 0.0-1.0
  },
  "description": "Human-readable assessment"
}
```

### Metrics Response
```json
{
  "accuracy": 0.996,
  "report": {
    "0": {"precision": 0.99, "recall": 0.99, "f1-score": 0.99, "support": 7073},
    "1": {"precision": 0.99, "recall": 0.99, "f1-score": 0.99, "support": 5424},
    "accuracy": 0.996,
    "macro avg": {...},
    "weighted avg": {...}
  }
}
```

