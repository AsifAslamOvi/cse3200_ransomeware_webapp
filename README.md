# Ransomware Detection Demo Web App

This repository is a small demo implementing the project proposal: an adaptive ransomware detection prototype.

Quick start (Windows / PowerShell):

1. Create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Place `data_file.csv` in the project folder (the CSV is expected at the repository root next to `app.py`).

3. Train the model (or use the Dashboard):

```powershell
python train_model.py
python app.py
```

4. Open http://localhost:5000 in your browser to use the dashboard.

## 📁 Project Structure

```
ransomware-webapp_with_model/
├── app.py                      # Flask app and API endpoints
├── model.py                    # Training, prediction, and dataset utilities
├── train_model.py             # CLI to train the model
├── notifier.py                # Multi-channel notifications
├── templates/index.html       # Enhanced dashboard UI
├── static/
│   ├── app.css               # Modern styling with animations
│   └── app.js                # Frontend interactivity
├── data_file.csv             # Training dataset (62K+ samples)
├── model.joblib              # Trained ML model
├── model_metrics.json        # Performance metrics
├── Dockerfile                # Container deployment
├── Procfile                  # Heroku deployment config
├── render.yaml               # Render deployment config
└── Documentation/
    ├── PROJECT_DETAILS.md           # Comprehensive project guide
    ├── API_QUICK_REFERENCE.md       # API documentation
    ├── TECHNICAL_ARCHITECTURE.md    # System design details
    └── USER_GUIDE.md                # Installation & usage guide
```

## 🚀 Deployment

### Deploy to Render (Free)

1. Fork/Clone this repository
2. Create account at [render.com](https://render.com)
3. New Web Service → Connect your GitHub repo
4. Render auto-detects `render.yaml` configuration
5. Click "Create Web Service"
6. Your live URL: `https://ransomware-webapp-<id>.onrender.com`

### Deploy to Heroku

```bash
heroku login
heroku create ransomware-detector
git push heroku master
heroku open
```

## 📖 Documentation

- **[PROJECT_DETAILS.md](PROJECT_DETAILS.md)** - Full technical specifications
- **[API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)** - REST API endpoints
- **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** - System architecture
- **[USER_GUIDE.md](USER_GUIDE.md)** - Setup and usage instructions

## Notifications
- Configure notification endpoints using environment variables or a `.env` file (see `.env.example`). Available options:
	- `MITIGATION_WEBHOOK_URL` - generic JSON webhook URL
	- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL
	- `MITIGATION_EMAIL_TO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` - email settings
- After updating env vars, restart the Flask app. Mitigation events will log notifications and return results in the `/api/mitigate` response.
