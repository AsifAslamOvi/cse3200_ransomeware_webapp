import os
import json
import smtplib
from email.message import EmailMessage
from typing import Any, Dict

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import requests


def _send_webhook(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        r = requests.post(url, json=payload, timeout=8)
        return {'status': 'ok' if r.ok else 'error', 'code': r.status_code, 'text': r.text}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _send_slack(webhook_url: str, text: str) -> Dict[str, Any]:
    payload = {'text': text}
    return _send_webhook(webhook_url, payload)


def _send_email(smtp_host: str, smtp_port: int, username: str, password: str, frm: str, to: str, subject: str, body: str) -> Dict[str, Any]:
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = frm
        msg['To'] = to
        msg.set_content(body)

        port = int(smtp_port)
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            server.starttls()

        if username:
            server.login(username, password)
        server.send_message(msg)
        server.quit()
        return {'status': 'ok'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def notify_mitigation(record: Dict[str, Any]) -> Dict[str, Any]:
    """Send notifications for a mitigation event.

    Environment variables used (any subset):
    - MITIGATION_WEBHOOK_URL: generic webhook POST URL
    - SLACK_WEBHOOK_URL: Slack incoming webhook URL
    - MITIGATION_EMAIL_TO: comma separated recipient list
    - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
    """
    results = {}

    webhook = os.getenv('MITIGATION_WEBHOOK_URL')
    slack = os.getenv('SLACK_WEBHOOK_URL')
    email_to = os.getenv('MITIGATION_EMAIL_TO')

    summary = f"Mitigation at {record.get('timestamp')} - quarantined file: {record.get('file', record.get('row', {}).get('FileName', 'unknown'))}"
    payload = {'summary': summary, 'record': record}

    if webhook:
        results['webhook'] = _send_webhook(webhook, payload)

    if slack:
        results['slack'] = _send_slack(slack, summary)

    if email_to:
        smtp_host = os.getenv('SMTP_HOST', 'localhost')
        smtp_port = os.getenv('SMTP_PORT', '25')
        smtp_user = os.getenv('SMTP_USER', '')
        smtp_pass = os.getenv('SMTP_PASS', '')
        email_from = os.getenv('EMAIL_FROM', smtp_user or f'no-reply@{os.getenv("HOSTNAME","localhost")}')
        # send to each recipient individually and collect results
        parts = [p.strip() for p in email_to.split(',') if p.strip()]
        email_results = {}
        for addr in parts:
            email_results[addr] = _send_email(smtp_host, smtp_port, smtp_user, smtp_pass, email_from, addr, 'Mitigation Notice', json.dumps(record, indent=2, default=str))
        results['email'] = email_results

    if not results:
        results['note'] = 'no notification settings configured'

    return results
