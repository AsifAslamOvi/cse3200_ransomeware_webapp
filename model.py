import sys
import os
# Protect against importing numpy from a shadowed local path.
# Ensure the virtualenv site-packages is prioritized on sys.path.
try:
    venv_site = os.path.join(os.path.dirname(sys.executable), 'Lib', 'site-packages')
    if os.path.isdir(venv_site) and venv_site not in sys.path:
        sys.path.insert(0, venv_site)
except Exception:
    pass
# If current working directory contains a local `numpy` module or package,
# remove cwd from sys.path so system numpy from site-packages is used.
try:
    cwd = os.getcwd()
    local_numpy_file = os.path.join(cwd, 'numpy.py')
    local_numpy_pkg = os.path.join(cwd, 'numpy')
    if os.path.exists(local_numpy_file) or os.path.isdir(local_numpy_pkg) or os.path.basename(cwd).lower() == 'numpy':
        sys.path = [p for p in sys.path if os.path.abspath(p) != os.path.abspath(cwd)]
except Exception:
    pass

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import json


def _select_features(df):
    drop_cols = ['FileName', 'md5Hash', 'Machine']
    X = df.drop(columns=[c for c in ['Benign'] if c in df.columns])
    for c in drop_cols:
        if c in X.columns:
            X = X.drop(columns=[c])
    # keep numeric columns only
    X = X.select_dtypes(include=['number']).fillna(0)
    return X


def train_model(data_path='data_file.csv', model_path='model.joblib'):
    df = pd.read_csv(data_path)
    if 'Benign' not in df.columns:
        return {'error': 'target column `Benign` not found in CSV'}
    X = _select_features(df)
    y = df['Benign'].astype(int)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    report = classification_report(y_test, y_pred, output_dict=True)
    joblib.dump(clf, model_path)
    metrics = {'accuracy': acc, 'report': report}
    with open(os.path.splitext(model_path)[0] + '_metrics.json', 'w') as f:
        json.dump(metrics, f)
    return metrics


def load_model(model_path='model.joblib'):
    if not os.path.exists(model_path):
        raise FileNotFoundError('Model not found. Train first via /api/train')
    return joblib.load(model_path)


def predict_row(model, row_dict):
    import pandas as pd
    X = pd.DataFrame([row_dict])
    X = X.select_dtypes(include=['number']).fillna(0)
    # Align input columns to model's training columns (if available)
    if hasattr(model, 'feature_names_in_'):
        trained_cols = list(model.feature_names_in_)
        # add any missing trained columns with zeros
        for c in trained_cols:
            if c not in X.columns:
                X[c] = 0
        # ensure column order matches training
        X = X[trained_cols]
    else:
        # fallback: keep numeric columns as-is
        X = X.reindex(sorted(X.columns), axis=1)
    pred = int(model.predict(X)[0])
    probs = None
    ransomware_prob = None
    benign_prob = None
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(X)[0]
        probs = {str(c): float(p) for c, p in zip(model.classes_, proba)}
        # map probabilities to named keys (ransomware=0, benign=1)
        try:
            # find index for class 0 and 1 if present
            classes = list(model.classes_)
            if 0 in classes:
                ransomware_prob = float(proba[classes.index(0)])
            if 1 in classes:
                benign_prob = float(proba[classes.index(1)])
        except Exception:
            pass

    # fallback if probs not available
    if ransomware_prob is None and benign_prob is None and probs:
        # try to assign by sorted class order
        items = list(probs.items())
        if len(items) >= 2:
            ransomware_prob = float(items[0][1])
            benign_prob = float(items[1][1])

    # when no probability info is available, set defaults
    ransomware_prob = 0.0 if ransomware_prob is None else ransomware_prob
    benign_prob = 0.0 if benign_prob is None else benign_prob

    # determine confidence and risk level
    max_prob = max(ransomware_prob, benign_prob)
    confidence = f"{round(max_prob*100)}%"
    if ransomware_prob >= 0.6:
        risk_level = 'High'
    elif ransomware_prob >= 0.4:
        risk_level = 'Medium'
    else:
        risk_level = 'Low'

    prediction_label = 'Ransomware' if pred == 0 else 'Benign'
    description = ('The system detected suspicious behavior consistent with ransomware activity.'
                   if pred == 0 else 'No ransomware-like behavior detected; sample judged benign.')

    out = {
        'prediction_label': prediction_label,
        'prediction_code': int(pred),
        'confidence': confidence,
        'risk_level': risk_level,
        'probabilities': {
            'ransomware': float(ransomware_prob),
            'benign': float(benign_prob)
        },
        'description': description
    }
    return out


def dataset_stats(data_path='data_file.csv'):
    df = pd.read_csv(data_path)
    stats = {}
    stats['shape'] = df.shape
    if 'Benign' in df.columns:
        stats['class_counts'] = df['Benign'].value_counts().to_dict()
    stats['head'] = df.head(5).to_dict(orient='records')
    # work with numeric features only and exclude the target if present
    # remove non-feature columns to match training feature selection
    drop_cols = ['FileName', 'md5Hash', 'Machine', 'Benign']
    num_df = df.select_dtypes(include=['number']).fillna(0)
    for c in drop_cols:
        if c in num_df.columns:
            num_df = num_df.drop(columns=[c])
    stats['numeric_columns'] = list(num_df.columns)
    stats['feature_means'] = num_df.mean().to_dict()
    stats['feature_stds'] = num_df.std().to_dict()
    return stats
