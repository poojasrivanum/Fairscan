# gemini_explainer.py — Calls Gemini API to generate plain-English bias explanations

import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()


def _build_prompt(metrics: dict) -> str:
    """Build the prompt we send to Gemini."""
    # Pull out the most severe attribute for the explanation
    attrs = metrics.get("metrics", {})
    worst_attr = None
    worst_di = 1.0
    for attr, m in attrs.items():
        if m["disparate_impact_ratio"] < worst_di:
            worst_di = m["disparate_impact_ratio"]
            worst_attr = attr

    summary = {}
    if worst_attr:
        m = attrs[worst_attr]
        summary = {
            "attribute": worst_attr,
            "privileged_group": m["privileged_group"],
            "unprivileged_group": m["unprivileged_group"],
            "privileged_rate": m["group_rates"][m["privileged_group"]],
            "unprivileged_rate": m["group_rates"][m["unprivileged_group"]],
            "disparate_impact_ratio": m["disparate_impact_ratio"],
            "demographic_parity_difference": m["demographic_parity_difference"],
            "overall_severity": metrics.get("overall_severity"),
            "outcome_column": metrics.get("outcome_column"),
            "total_rows": metrics.get("total_rows"),
        }

    return f"""You are a fairness expert explaining AI bias to a non-technical HR manager or business leader.

Bias analysis results: {json.dumps(summary)}

Write a response in this EXACT JSON format (no markdown, no extra text):
{{
  "explanation": "2-3 sentences explaining the most serious bias found. Use specific numbers. Example style: 'Women were hired 31% less often than men with identical qualifications. This violates the legal 80% rule threshold, meaning your hiring AI may be discriminatory under equal opportunity laws.'",
  "recommendations": [
    "One specific actionable fix using a named technique (e.g., reweighing, oversampling, threshold calibration)",
    "A second distinct fix focusing on a different approach",
    "A third fix about monitoring or auditing going forward"
  ]
}}"""


def _fallback_explanation(metrics: dict) -> dict:
    """Hardcoded fallback if Gemini API is unavailable."""
    attrs = metrics.get("metrics", {})
    severity = metrics.get("overall_severity", "MEDIUM")
    outcome = metrics.get("outcome_column", "outcome")

    explanations = []
    for attr, m in attrs.items():
        priv = m["privileged_group"]
        unpriv = m["unprivileged_group"]
        priv_rate = round(m["group_rates"][priv] * 100, 1)
        unpriv_rate = round(m["group_rates"][unpriv] * 100, 1)
        di = m["disparate_impact_ratio"]
        explanations.append(
            f"{priv} applicants received a positive {outcome} decision {priv_rate}% of the time, "
            f"compared to only {unpriv_rate}% for {unpriv} applicants — a disparate impact ratio of {di}, "
            f"which {'violates' if di < 0.8 else 'approaches'} the legal 80% threshold."
        )

    explanation_text = " ".join(explanations) if explanations else (
        f"The analysis detected {severity.lower()} severity bias in the dataset. "
        f"Some groups are receiving significantly different {outcome} rates, "
        f"which may indicate systemic discrimination in the underlying decision process."
    )

    return {
        "explanation": explanation_text,
        "recommendations": [
            "Apply reweighing to the training dataset: assign higher sample weights to underrepresented groups so the model treats them equitably during training.",
            "Use threshold calibration per demographic group: set different decision thresholds for each group so that false negative rates are equalized across populations.",
            "Implement quarterly bias audits using FairScan or a similar tool, and establish an internal fairness review board to monitor model outputs before deployment.",
        ],
    }


def explain_bias(metrics: dict) -> dict:
    """
    Call Gemini API to generate plain-English explanation + recommendations.
    Falls back gracefully if the API key is missing or the call fails.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not api_key or api_key == "your_gemini_api_key_here":
        print("GEMINI_API_KEY not set — using fallback explanation.")
        return _fallback_explanation(metrics)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        text = response.text.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        parsed = json.loads(text)
        # Validate structure
        if "explanation" not in parsed or "recommendations" not in parsed:
            raise ValueError("Unexpected Gemini response structure")
        return parsed

    except Exception as e:
        print(f"Gemini API error: {e} — using fallback explanation.")
        return _fallback_explanation(metrics)
