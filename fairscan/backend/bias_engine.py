# bias_engine.py — Enhanced & Stable Fairness Engine

import pandas as pd
import numpy as np
from scipy.stats import chi2_contingency
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

PROTECTED_KEYWORDS = ["gender", "sex", "race", "ethnicity", "age", "religion", "nationality", "disability"]


# -----------------------------
# Detect protected attributes
# -----------------------------
def detect_protected_attributes(df: pd.DataFrame, outcome_col: str) -> list:
    protected = []
    for col in df.columns:
        if col == outcome_col:
            continue
        if any(keyword in col.lower() for keyword in PROTECTED_KEYWORDS):
            protected.append(col)
    return protected


# -----------------------------
# Severity classification
# -----------------------------
def get_severity(ratio=None, diff=None):
    if ratio is not None:
        if ratio < 0.6:
            return "HIGH"
        elif ratio < 0.8:
            return "MEDIUM"
        else:
            return "LOW"

    if diff is not None:
        if abs(diff) > 0.3:
            return "HIGH"
        elif abs(diff) > 0.1:
            return "MEDIUM"
        else:
            return "LOW"

    return "LOW"


# -----------------------------
# Feature importance
# -----------------------------
def compute_feature_importance(df: pd.DataFrame, outcome_col: str):
    X = df.drop(columns=[outcome_col])
    y = df[outcome_col]

    X_encoded = X.copy()
    for col in X_encoded.select_dtypes(include=["object"]).columns:
        le = LabelEncoder()
        X_encoded[col] = le.fit_transform(X_encoded[col].astype(str))

    try:
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X_encoded, y)
        importances = clf.feature_importances_
        features = X_encoded.columns.tolist()

        ranked = sorted(zip(features, importances), key=lambda x: x[1], reverse=True)
        return [{"feature": f, "importance": round(float(i), 4)} for f, i in ranked[:6]]
    except Exception:
        return []


# -----------------------------
# Bias score (FIXED)
# -----------------------------
def calculate_bias_score(metrics_dict):
    total_score = 0
    count = 0

    for attr, m in metrics_dict.items():
        di = m["disparate_impact_ratio"]
        dp = m["demographic_parity_difference"]
        sig = m["statistically_significant"]

        # normalize safety (in case % comes)
        if dp > 1:
            dp = dp / 100

        local_score = 0

        # Only penalize REAL bias
        if di < 0.8:
            local_score += (0.8 - di) * 100

        if abs(dp) > 0.1:   # ignore small noise
            local_score += abs(dp) * 100

        if sig and (di < 0.8 or abs(dp) > 0.1):
            local_score += 10

        total_score += local_score
        count += 1

    if count == 0:
        return 0

    score = total_score / count
    return round(min(score, 100))


# -----------------------------
# Root cause detection
# -----------------------------
def detect_root_causes(feature_importance, protected_attrs):
    causes = []

    for f in feature_importance:
        name = f["feature"]
        imp = f["importance"]

        if imp > 0.2:
            risk = "HIGH" if name.lower() in [p.lower() for p in protected_attrs] else "MEDIUM"
            causes.append({
                "feature": name,
                "importance": imp,
                "risk": risk
            })

    return causes


# -----------------------------
# MAIN FUNCTION
# -----------------------------
def analyze_bias(df: pd.DataFrame, outcome_col: str) -> dict:

    if outcome_col not in df.columns:
        raise ValueError(f"Outcome column '{outcome_col}' not found.")

    protected_attrs = detect_protected_attributes(df, outcome_col)

    if not protected_attrs:
        raise ValueError("No protected attributes detected.")

    metrics = {}
    severity_flags = []

    for attr in protected_attrs:

        # 🔥 FIX: Skip continuous attributes (like age)
        if df[attr].nunique() > 10:
            continue

        group_rates = {}
        for group in df[attr].unique():
            subset = df[df[attr] == group]
            rate = subset[outcome_col].mean()
            group_rates[str(group)] = round(float(rate), 4)

        if len(group_rates) < 2:
            continue

        rates = list(group_rates.values())
        max_rate = max(rates)
        min_rate = min(rates)

        privileged = max(group_rates, key=group_rates.get)
        unprivileged = min(group_rates, key=group_rates.get)

        # Metrics
        di = round(min_rate / max_rate, 4) if max_rate > 0 else 1.0
        dp = round(max_rate - min_rate, 4)

        di_sev = get_severity(ratio=di)
        dp_sev = get_severity(diff=dp)

        # Chi-square
        contingency = pd.crosstab(df[attr], df[outcome_col])
        try:
            chi2, p, _, _ = chi2_contingency(contingency)
            p = round(float(p), 6)
            significant = p < 0.05
        except:
            p = 1.0
            significant = False

        # Only consider real bias for severity
        if di < 0.8 or abs(dp) > 0.1:
            severity_flags.append(di_sev)
            severity_flags.append(dp_sev)

        metrics[attr] = {
            "disparate_impact_ratio": di,
            "disparate_impact_severity": di_sev,
            "demographic_parity_difference": dp,
            "demographic_parity_severity": dp_sev,
            "chi_square_p_value": p,
            "statistically_significant": significant,
            "group_rates": group_rates,
            "privileged_group": privileged,
            "unprivileged_group": unprivileged,
        }

    # Overall severity (correct logic)
    if "HIGH" in severity_flags:
        overall = "HIGH"
    elif "MEDIUM" in severity_flags:
        overall = "MEDIUM"
    else:
        overall = "LOW"

    feature_importance = compute_feature_importance(df, outcome_col)
    bias_score = calculate_bias_score(metrics)
    root_causes = detect_root_causes(feature_importance, protected_attrs)

    return {
        "protected_attributes": protected_attrs,
        "outcome_column": outcome_col,
        "overall_severity": overall,
        "bias_score": bias_score,
        "metrics": metrics,
        "feature_importance": feature_importance,
        "root_causes": root_causes,
        "total_rows": len(df),
        "outcome_positive_rate": round(float(df[outcome_col].mean()), 4),
    }