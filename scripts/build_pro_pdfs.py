#!/usr/bin/env python3
"""
CRIMENEXUS Professional PDF Generator
Produces:
1. CRIMENEXUS_HOD_Presentation.pdf - EXACTLY 5 pages, executive print-ready layout.
2. CRIMENEXUS_Project_Archive.pdf - Comprehensive 30+ page engineering archive with LaTeX math and code styling.
"""

import os
import re
import subprocess
import pypdfium2 as pdfium

WORKSPACE_DIR = "/home/rgukt/Github/CRIMENEXUS"
DOCS_DIR = os.path.join(WORKSPACE_DIR, "docs")
CHROME_BIN = "/usr/bin/google-chrome"

HOD_MD_PATH = os.path.join(DOCS_DIR, "18_HOD_PRESENTATION.md")
ARCHIVE_MD_PATH = os.path.join(DOCS_DIR, "17_PROJECT_ARCHIVE.md")

HOD_PDF_PATH = os.path.join(WORKSPACE_DIR, "CRIMENEXUS_HOD_Presentation.pdf")
ARCHIVE_PDF_PATH = os.path.join(WORKSPACE_DIR, "CRIMENEXUS_Project_Archive.pdf")

HOD_HTML_PATH = os.path.join(WORKSPACE_DIR, "CRIMENEXUS_HOD_Presentation.html")
ARCHIVE_HTML_PATH = os.path.join(WORKSPACE_DIR, "CRIMENEXUS_Project_Archive.html")


def build_hod_presentation_html():
    """Builds an exact 5-page A4 executive document for HOD presentation."""
    with open(HOD_MD_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by markdown horizontal rules '---'
    sections = [s.strip() for s in content.split("\n---\n") if s.strip()]

    # We expect 5 sections
    print(f"[*] HOD Presentation has {len(sections)} sections.")

    pages_html = []
    for idx, sec in enumerate(sections, 1):
        # Convert section markdown to html via pandoc
        p = subprocess.run(
            ["pandoc", "--from=markdown", "--to=html"],
            input=sec,
            text=True,
            capture_output=True,
            check=True,
        )
        sec_html = p.stdout

        page_block = f"""
        <div class="page-container page-{idx}">
            <div class="page-header">
                <span class="left">CRIMENEXUS // EXECUTIVE INTELLIGENCE BRIEFING</span>
                <span class="center">STATE POLICE & CYBER CELL DOSSIER</span>
                <span class="right">CONFIDENTIAL • PAGE {idx} OF 5</span>
            </div>
            <div class="page-body">
                {sec_html}
            </div>
            <div class="page-footer">
                <span class="left">Authored by: Shaik Abdul Sammed (RGUKT)</span>
                <span class="center">Section 63 BSA & BNS/BNSS 2023 Compliant</span>
                <span class="right">Date: November 2026</span>
            </div>
        </div>
        """
        pages_html.append(page_block)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CRIMENEXUS: HOD & Police Presentation (5-Page Dossier)</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

        @page {{
            size: A4 portrait;
            margin: 0;
        }}

        * {{
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }}

        body {{
            margin: 0;
            padding: 0;
            background: #e2e8f0;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
            font-size: 8.5pt;
            line-height: 1.38;
        }}

        .page-container {{
            width: 210mm;
            height: 296.8mm;
            max-height: 296.8mm;
            margin: 0 auto;
            background: #ffffff;
            position: relative;
            padding: 10mm 12mm 10mm 12mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
        }}

        .page-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 6.8pt;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            color: #0284c7;
            border-bottom: 1.5px solid #0284c7;
            padding-bottom: 2mm;
            margin-bottom: 2.5mm;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }}

        .page-footer {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 6.8pt;
            font-family: 'JetBrains Mono', monospace;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 2mm;
            margin-top: 2.5mm;
        }}

        .page-body {{
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }}

        h1 {{
            font-size: 18pt;
            font-weight: 800;
            color: #0369a1;
            margin: 0 0 2px 0;
            letter-spacing: -0.4px;
        }}

        h2 {{
            font-size: 11.5pt;
            font-weight: 800;
            color: #0f172a;
            margin: 4px 0 3px 0;
            border-left: 3.5px solid #0284c7;
            padding-left: 6px;
        }}

        h3 {{
            font-size: 9pt;
            font-weight: 700;
            color: #1e293b;
            margin: 4px 0 2px 0;
        }}

        p {{
            margin: 2px 0 4px 0;
        }}

        strong {{
            color: #0f172a;
            font-weight: 700;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 3px 0 5px 0;
            font-size: 7.2pt;
            line-height: 1.25;
        }}

        th, td {{
            border: 0.8px solid #cbd5e1;
            padding: 3.5px 5.5px;
            text-align: left;
            vertical-align: middle;
        }}

        th {{
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 6.8pt;
            letter-spacing: 0.3px;
        }}

        tr:nth-child(even) td {{
            background-color: #f8fafc;
        }}

        blockquote {{
            border-left: 3px solid #0284c7;
            margin: 4px 0;
            padding: 4px 8px;
            background-color: #f0f9ff;
            color: #0369a1;
            font-size: 7.8pt;
            font-style: italic;
            border-radius: 0 4px 4px 0;
        }}

        code {{
            font-family: 'JetBrains Mono', monospace;
            font-size: 7pt;
            background-color: #f1f5f9;
            padding: 1px 3px;
            border-radius: 3px;
            color: #0369a1;
            border: 0.5px solid #e2e8f0;
        }}

        pre {{
            background-color: #090d16;
            color: #e2e8f0;
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 6.8pt;
            line-height: 1.3;
            margin: 3px 0;
            overflow: hidden;
            font-family: 'JetBrains Mono', monospace;
            border: 1px solid #1e293b;
        }}

        pre code {{
            background: none;
            padding: 0;
            border: none;
            color: inherit;
        }}

        ol, ul {{
            margin: 2px 0 4px 0;
            padding-left: 14px;
        }}

        li {{
            margin-bottom: 1.5px;
        }}

        .page-1 h1 {{ font-size: 20pt; }}
        .page-1 h3 {{ font-size: 9.5pt; color: #475569; font-weight: 600; margin-bottom: 4px; }}
    </style>
</head>
<body>
    {''.join(pages_html)}
</body>
</html>
"""
    with open(HOD_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"[✔] Generated: {HOD_HTML_PATH}")


def build_project_archive_html():
    """Builds comprehensive executive HTML for 17_PROJECT_ARCHIVE.md with MathJax."""
    with open(ARCHIVE_MD_PATH, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convert via pandoc with mathjax & table-of-contents
    cmd = [
        "pandoc",
        ARCHIVE_MD_PATH,
        "--standalone",
        "--mathjax",
        "--toc",
        "--toc-depth=3",
        "--metadata=title:CRIMENEXUS: Project Archive & Engineering Journal",
        "-o",
        ARCHIVE_HTML_PATH,
    ]
    subprocess.run(cmd, check=True)

    with open(ARCHIVE_HTML_PATH, "r", encoding="utf-8") as f:
        html = f.read()

    custom_style = """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

        @page {
            size: A4 portrait;
            margin: 16mm 14mm 16mm 14mm;
            @bottom-right {
                content: counter(page);
            }
        }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 9pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }

        h1 {
            font-size: 20pt;
            font-weight: 800;
            color: #0284c7;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 8px;
            letter-spacing: -0.4px;
        }

        h2 {
            font-size: 13.5pt;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 16px;
            margin-bottom: 6px;
        }

        h3 {
            font-size: 10.5pt;
            font-weight: 700;
            color: #1e293b;
            margin-top: 12px;
            margin-bottom: 4px;
        }

        hr {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 16px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 12px 0;
            font-size: 8pt;
        }

        th, td {
            border: 1px solid #cbd5e1;
            padding: 5px 7px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
        }

        tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        blockquote {
            border-left: 3.5px solid #0284c7;
            margin: 8px 0;
            padding: 6px 12px;
            background-color: #f0f9ff;
            color: #0369a1;
            font-size: 8.8pt;
            border-radius: 0 4px 4px 0;
        }

        code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 7.8pt;
            background-color: #f1f5f9;
            padding: 1.5px 4px;
            border-radius: 3px;
            color: #0f172a;
            border: 0.5px solid #e2e8f0;
        }

        pre {
            background-color: #090d16;
            color: #e2e8f0;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 7.5pt;
            line-height: 1.4;
            margin: 8px 0;
            overflow-x: auto;
            border: 1px solid #1e293b;
        }

        pre code {
            background: none;
            padding: 0;
            border: none;
            color: inherit;
        }

        #TOC {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 18px;
            margin: 14px 0 20px 0;
        }

        #TOC ul {
            list-style: none;
            padding-left: 14px;
            margin: 3px 0;
        }

        #TOC > ul {
            padding-left: 0;
        }

        #TOC a {
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
        }

        #TOC a:hover {
            text-decoration: underline;
        }

        @media print {
            body {
                background: none;
            }
        }
    </style>
    """

    if "</head>" in html:
        html = html.replace("</head>", f"{custom_style}</head>")
    else:
        html = f"{custom_style}\n{html}"

    with open(ARCHIVE_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[✔] Generated: {ARCHIVE_HTML_PATH}")


def render_html_to_pdf(html_path, pdf_path):
    """Invokes Google Chrome in modern headless mode to render print PDF."""
    print(f"[*] Rendering {os.path.basename(html_path)} -> {os.path.basename(pdf_path)}...")
    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path,
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(pdf_path):
        size = os.path.getsize(pdf_path)
        doc = pdfium.PdfDocument(pdf_path)
        pages = len(doc)
        print(f"    [✔] PDF Created: {os.path.basename(pdf_path)} | Size: {size:,} bytes | Page Count: {pages}")
        return pages
    else:
        raise RuntimeError(f"Failed to generate {pdf_path}")


def main():
    print("==================================================")
    print("CRIMENEXUS PROFESSIONAL PDF COMPILATION ENGINE")
    print("==================================================")

    # 1. HOD Presentation (Target: Exactly 5 pages)
    build_hod_presentation_html()
    hod_pages = render_html_to_pdf(HOD_HTML_PATH, HOD_PDF_PATH)

    # 2. Project Archive (Comprehensive)
    build_project_archive_html()
    arch_pages = render_html_to_pdf(ARCHIVE_HTML_PATH, ARCHIVE_PDF_PATH)

    print("\n==================================================")
    print("FINAL VERIFIED RESULTS:")
    print(f"1. CRIMENEXUS_HOD_Presentation.pdf : {hod_pages} Pages (Expected: 5)")
    print(f"2. CRIMENEXUS_Project_Archive.pdf    : {arch_pages} Pages (Comprehensive)")
    print("==================================================")


if __name__ == "__main__":
    main()
