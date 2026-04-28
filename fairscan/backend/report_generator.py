# report_generator.py — Generates a professional PDF audit report using ReportLab

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Brand colors
NAVY = colors.HexColor("#0F172A")
INDIGO = colors.HexColor("#4F46E5")
RED = colors.HexColor("#DC2626")
ORANGE = colors.HexColor("#D97706")
GREEN = colors.HexColor("#16A34A")
LIGHT_GRAY = colors.HexColor("#F8FAFC")
MID_GRAY = colors.HexColor("#64748B")
BORDER = colors.HexColor("#E2E8F0")


def severity_color(severity: str):
    return {"HIGH": RED, "MEDIUM": ORANGE, "LOW": GREEN}.get(severity, MID_GRAY)


def generate_pdf(metrics: dict, explanation: dict) -> bytes:
    """Build and return a complete bias audit report as PDF bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── HEADER ──────────────────────────────────────────────────────────
    header_table = Table(
        [[
            Paragraph("<b>FairScan</b>", ParagraphStyle(
                "brand", fontSize=22, textColor=colors.white,
                fontName="Helvetica-Bold"
            )),
            Paragraph(
                f"Bias Audit Report<br/><font size='9'>{datetime.now().strftime('%B %d, %Y at %H:%M')}</font>",
                ParagraphStyle("hdrRight", fontSize=11, textColor=colors.white,
                               alignment=TA_CENTER, fontName="Helvetica")
            ),
        ]],
        colWidths=["50%", "50%"],
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("PADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6 * mm))

    # ── SEVERITY BADGE ───────────────────────────────────────────────────
    severity = metrics.get("overall_severity", "MEDIUM")
    sev_color = severity_color(severity)

    sev_table = Table(
        [[
            Paragraph(
                f"Overall Severity: <b>{severity}</b>",
                ParagraphStyle("sev", fontSize=14, textColor=colors.white,
                               fontName="Helvetica-Bold", alignment=TA_CENTER)
            )
        ]],
        colWidths=["100%"],
    )
    sev_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), sev_color),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
    ]))
    story.append(sev_table)
    story.append(Spacer(1, 5 * mm))

    # Dataset summary
    total = metrics.get("total_rows", "N/A")
    outcome = metrics.get("outcome_column", "outcome")
    pos_rate = round(metrics.get("outcome_positive_rate", 0) * 100, 1)
    attrs = ", ".join(metrics.get("protected_attributes", []))

    summary_data = [
        ["Dataset rows", str(total), "Outcome column", outcome],
        ["Positive outcome rate", f"{pos_rate}%", "Protected attributes found", attrs],
    ]
    sum_table = Table(summary_data, colWidths=["30%", "20%", "30%", "20%"])
    sum_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 5 * mm))

    # ── EXECUTIVE SUMMARY ────────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", ParagraphStyle(
        "h2", fontSize=14, fontName="Helvetica-Bold", textColor=NAVY,
        spaceBefore=4
    )))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 3 * mm))

    explanation_text = explanation.get("explanation", "No explanation available.")
    story.append(Paragraph(explanation_text, ParagraphStyle(
        "body", fontSize=10, leading=16, textColor=colors.HexColor("#1E293B")
    )))
    story.append(Spacer(1, 5 * mm))

    # ── METRICS PER ATTRIBUTE ────────────────────────────────────────────
    story.append(Paragraph("Fairness Metrics by Protected Attribute", ParagraphStyle(
        "h2", fontSize=14, fontName="Helvetica-Bold", textColor=NAVY
    )))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 3 * mm))

    for attr, m in metrics.get("metrics", {}).items():
        story.append(Paragraph(f"Attribute: {attr.upper()}", ParagraphStyle(
            "h3", fontSize=11, fontName="Helvetica-Bold", textColor=INDIGO,
            spaceBefore=6
        )))

        # Group rates table
        group_data = [["Group", "Outcome Rate", "vs Privileged"]]
        priv_rate = m["group_rates"].get(m["privileged_group"], 0)
        for group, rate in m["group_rates"].items():
            diff = round((rate - priv_rate) * 100, 1)
            diff_str = f"{diff:+.1f}%" if group != m["privileged_group"] else "—  (reference)"
            group_data.append([group, f"{round(rate*100,1)}%", diff_str])

        gt = Table(group_data, colWidths=["33%", "33%", "34%"])
        gt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ]))
        story.append(gt)
        story.append(Spacer(1, 3 * mm))

        # Metric scores table
        di_sev = m["disparate_impact_severity"]
        dp_sev = m["demographic_parity_severity"]
        metric_data = [
            ["Metric", "Value", "Threshold", "Severity", "Status"],
            [
                "Disparate Impact Ratio",
                str(m["disparate_impact_ratio"]),
                "≥ 0.80 (80% rule)",
                di_sev,
                "✗ FAIL" if m["disparate_impact_ratio"] < 0.8 else "✓ PASS",
            ],
            [
                "Demographic Parity Diff",
                str(m["demographic_parity_difference"]),
                "≤ 0.10",
                dp_sev,
                "✗ FAIL" if m["demographic_parity_difference"] > 0.1 else "✓ PASS",
            ],
            [
                "Chi-Square p-value",
                str(m["chi_square_p_value"]),
                "< 0.05 = significant",
                "HIGH" if m["statistically_significant"] else "LOW",
                "SIGNIFICANT" if m["statistically_significant"] else "NOT SIGNIFICANT",
            ],
        ]
        mt = Table(metric_data, colWidths=["30%", "15%", "22%", "15%", "18%"])
        mt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("TEXTCOLOR", (3, 1), (3, 1), severity_color(di_sev)),
            ("TEXTCOLOR", (3, 2), (3, 2), severity_color(dp_sev)),
            ("FONTNAME", (3, 1), (4, -1), "Helvetica-Bold"),
        ]))
        story.append(mt)
        story.append(Spacer(1, 5 * mm))

    # ── FEATURE IMPORTANCE ───────────────────────────────────────────────
    fi = metrics.get("feature_importance", [])
    if fi:
        story.append(Paragraph("Top Bias Drivers (Feature Importance)", ParagraphStyle(
            "h2", fontSize=14, fontName="Helvetica-Bold", textColor=NAVY
        )))
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
        story.append(Spacer(1, 3 * mm))

        protected = [a.lower() for a in metrics.get("protected_attributes", [])]
        fi_data = [["Feature", "Importance Score", "Type"]]
        for item in fi:
            feat = item["feature"]
            imp = f"{round(item['importance']*100, 1)}%"
            ftype = "Protected Attribute" if feat.lower() in protected else "General Feature"
            fi_data.append([feat, imp, ftype])

        fit = Table(fi_data, colWidths=["40%", "30%", "30%"])
        fit.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ]))
        story.append(fit)
        story.append(Spacer(1, 5 * mm))

    # ── RECOMMENDATIONS ──────────────────────────────────────────────────
    recs = explanation.get("recommendations", [])
    if recs:
        story.append(Paragraph("Recommended Actions", ParagraphStyle(
            "h2", fontSize=14, fontName="Helvetica-Bold", textColor=NAVY
        )))
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
        story.append(Spacer(1, 3 * mm))

        for i, rec in enumerate(recs, 1):
            rec_table = Table(
                [[
                    Paragraph(f"<b>{i}</b>", ParagraphStyle(
                        "rnum", fontSize=13, textColor=colors.white,
                        fontName="Helvetica-Bold", alignment=TA_CENTER
                    )),
                    Paragraph(rec, ParagraphStyle(
                        "rbody", fontSize=10, leading=15,
                        textColor=colors.HexColor("#1E293B")
                    )),
                ]],
                colWidths=["8%", "92%"],
            )
            rec_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, 0), GREEN),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#F0FDF4")),
                ("PADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER),
            ]))
            story.append(rec_table)
            story.append(Spacer(1, 2 * mm))

    story.append(Spacer(1, 8 * mm))

    # ── FOOTER ───────────────────────────────────────────────────────────
    footer = Table(
        [[Paragraph(
            "Generated by <b>FairScan</b> | Google Solution Challenge 2025 | "
            "SDG 10: Reduced Inequalities · SDG 16: Justice & Strong Institutions",
            ParagraphStyle("footer", fontSize=8, textColor=colors.white,
                           alignment=TA_CENTER)
        )]],
        colWidths=["100%"],
    )
    footer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("PADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(footer)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
