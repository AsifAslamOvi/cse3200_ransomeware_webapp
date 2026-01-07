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

Files:
- `app.py` — Flask app and API endpoints
- `model.py` — training, prediction, and dataset utilities
- `train_model.py` — CLI to train the model
- `templates/index.html` — simple dashboard UI

Notifications:
- Configure notification endpoints using environment variables or a `.env` file (see `.env.example`). Available options:
	- `MITIGATION_WEBHOOK_URL` - generic JSON webhook URL
	- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL
	- `MITIGATION_EMAIL_TO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` - email settings
- After updating env vars, restart the Flask app. Mitigation events will log notifications and return results in the `/api/mitigate` response.
