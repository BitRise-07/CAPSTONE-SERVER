from pathlib import Path
import re
import textwrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Preformatted,
    PageBreak,
)


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "Fraud_Detection_Project_API_and_Logic_Guide.md"
OUTPUT = ROOT / "Fraud_Detection_Project_API_and_Logic_Guide.pdf"


def escape(text):
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline_markup(text):
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def split_table_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def is_separator(row):
    return all(set(cell.replace(":", "").replace("-", "").strip()) == set() for cell in row)


def wrap_code(text, width=105):
    wrapped = []
    for line in text.splitlines():
        if len(line) <= width:
            wrapped.append(line)
        else:
            wrapped.extend(textwrap.wrap(line, width=width, replace_whitespace=False, drop_whitespace=False))
    return "\n".join(wrapped)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#12355B"),
        spaceAfter=16,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        parent=styles["Normal"],
        fontSize=11.5,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#475467"),
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="H1x",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=21,
        textColor=colors.HexColor("#12355B"),
        spaceBefore=8,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="H2x",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=16,
        textColor=colors.HexColor("#1C5D99"),
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="H3x",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#233142"),
        spaceBefore=6,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Bodyx",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=12.1,
        textColor=colors.HexColor("#1F2933"),
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Bulletx",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=11.8,
        leftIndent=13,
        bulletIndent=4,
        spaceAfter=2.5,
    )
)
styles.add(
    ParagraphStyle(
        name="Codex",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=6.5,
        leading=8.0,
        backColor=colors.HexColor("#F6F8FA"),
        borderColor=colors.HexColor("#D0D7DE"),
        borderWidth=0.35,
        borderPadding=5,
        spaceBefore=3,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9,
        textColor=colors.white,
    )
)
styles.add(
    ParagraphStyle(
        name="TableCell",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=6.9,
        leading=8.7,
        textColor=colors.HexColor("#1F2933"),
    )
)


def build_table(rows, available_width):
    headers = rows[0]
    body = rows[2:] if len(rows) > 1 and is_separator(rows[1]) else rows[1:]
    data = [[Paragraph(inline_markup(cell), styles["TableHead"]) for cell in headers]]
    for row in body:
        if len(row) < len(headers):
            row = row + [""] * (len(headers) - len(row))
        data.append([Paragraph(inline_markup(cell), styles["TableCell"]) for cell in row[: len(headers)]])

    col_count = len(headers)
    if col_count == 2:
        widths = [available_width * 0.30, available_width * 0.70]
    elif col_count == 3:
        widths = [available_width * 0.24, available_width * 0.33, available_width * 0.43]
    elif col_count == 4:
        widths = [available_width * 0.18, available_width * 0.30, available_width * 0.18, available_width * 0.34]
    else:
        widths = [available_width / col_count] * col_count

    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12355B")),
                ("BOX", (0, 0), (-1, -1), 0.45, colors.HexColor("#B8C2CC")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D0D7DE")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def parse_markdown(md_text, available_width):
    lines = md_text.splitlines()
    story = []
    paragraph = []
    code_lines = []
    table_lines = []
    in_code = False
    first_h1 = True

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            text = " ".join(part.strip() for part in paragraph if part.strip())
            if text:
                story.append(Paragraph(inline_markup(text), styles["Bodyx"]))
            paragraph = []

    def flush_code():
        nonlocal code_lines
        if code_lines:
            story.append(Preformatted(wrap_code("\n".join(code_lines)), styles["Codex"]))
            code_lines = []

    def flush_table():
        nonlocal table_lines
        if table_lines:
            rows = [split_table_row(line) for line in table_lines]
            story.append(build_table(rows, available_width))
            story.append(Spacer(1, 5))
            table_lines = []

    for line in lines:
        stripped = line.rstrip()

        if stripped.startswith("```"):
            flush_paragraph()
            flush_table()
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(stripped)
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            flush_paragraph()
            table_lines.append(stripped)
            continue
        else:
            flush_table()

        if not stripped:
            flush_paragraph()
            story.append(Spacer(1, 3))
            continue

        if stripped.startswith("# "):
            flush_paragraph()
            title = stripped[2:].strip()
            if first_h1:
                first_h1 = False
            else:
                story.append(PageBreak())
            story.append(Paragraph(inline_markup(title), styles["H1x"]))
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[3:].strip()), styles["H2x"]))
            continue

        if stripped.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[4:].strip()), styles["H3x"]))
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[2:].strip()), styles["Bulletx"], bulletText="-"))
            continue

        paragraph.append(stripped)

    flush_paragraph()
    flush_table()
    flush_code()
    return story


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.2)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(doc.leftMargin, 0.42 * inch, "Financial Fraud Detection Project - API and Logic Guide")
    canvas.drawRightString(A4[0] - doc.rightMargin, 0.42 * inch, f"Page {doc.page}")
    canvas.restoreState()


def main():
    md_text = SOURCE.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=1.25 * cm,
        rightMargin=1.25 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.25 * cm,
        title="Financial Fraud Detection Project API and Logic Guide",
        author="Codex",
    )

    story = [
        Spacer(1, 1.0 * inch),
        Paragraph("Financial Fraud Detection Project", styles["CoverTitle"]),
        Paragraph("API Routes, Request/Response Samples, Rule Engine, ML, ROC, and Dashboard Usage", styles["CoverSub"]),
        Paragraph("Generated from the current server-changed branch on 2026-05-13", styles["CoverSub"]),
        Spacer(1, 0.35 * inch),
        Paragraph(
            "This PDF is built from the live project files in E:\\CAPSTONE and includes sample payloads for Express and Flask routes.",
            styles["Bodyx"],
        ),
        PageBreak(),
    ]
    story.extend(parse_markdown(md_text, doc.width))
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(OUTPUT)


if __name__ == "__main__":
    main()
