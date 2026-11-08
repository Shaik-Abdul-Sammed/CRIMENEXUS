#!/usr/bin/env python3
"""
CRIMENEXUS Document to PDF Converter
Converts Markdown presentation and archive files into polished PDF documents.
Supports:
1. Headless Chrome / Chromium (`--print-to-pdf`)
2. Pandoc + HTML
3. Weasyprint / wkhtmltopdf (if installed)
"""

import os
import sys
import subprocess
import shutil

DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FILES = [
    {
        "md": os.path.join(DOCS_DIR, "18_HOD_PRESENTATION.md"),
        "pdf": os.path.join(ROOT_DIR, "CRIMENEXUS_HOD_Presentation.pdf"),
        "html": os.path.join(ROOT_DIR, "CRIMENEXUS_HOD_Presentation.html"),
        "title": "CRIMENEXUS: HOD & Police Presentation (5-Page Dossier)",
    },
    {
        "md": os.path.join(DOCS_DIR, "17_PROJECT_ARCHIVE.md"),
        "pdf": os.path.join(ROOT_DIR, "CRIMENEXUS_Project_Archive.pdf"),
        "html": os.path.join(ROOT_DIR, "CRIMENEXUS_Project_Archive.html"),
        "title": "CRIMENEXUS: Full Project Archive & Engineering Journal",
    },
]

CSS_STYLE = """
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.55;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }

  h1 {
    font-size: 22pt;
    font-weight: 900;
    color: #0284c7;
    margin-top: 0;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }

  h2 {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 4px;
    margin-top: 18px;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 12pt;
    font-weight: 700;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
  }

  hr {
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 20px 0;
    page-break-after: always;
    break-after: page;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 6px 9px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  blockquote {
    border-left: 4px solid #0284c7;
    margin: 12px 0;
    padding: 8px 14px;
    background-color: #f0f9ff;
    color: #0369a1;
    font-style: italic;
    border-radius: 0 6px 6px 0;
    font-size: 10pt;
  }

  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
    color: #0f172a;
    border: 1px solid #e2e8f0;
  }

  pre {
    background-color: #090d16;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.45;
  }

  pre code {
    background: none;
    padding: 0;
    border: none;
    color: inherit;
  }

  @media print {
    body {
      background: none;
    }
    .no-print {
      display: none;
    }
    hr {
      page-break-after: always !important;
      break-after: page !important;
      visibility: hidden;
      height: 0;
      margin: 0;
    }
  }
</style>
"""


def find_browser():
    """Locate headless Chrome or Chromium executable."""
    candidates = [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ]
    for c in candidates:
        if shutil.which(c):
            return c
    return None


def convert_via_pandoc_and_browser(item, browser_path):
    md_file = item["md"]
    html_file = item["html"]
    pdf_file = item["pdf"]

    print(f"[*] Processing: {os.path.basename(md_file)}")

    # 1. Convert Markdown to HTML via pandoc
    cmd_pandoc = [
        "pandoc",
        md_file,
        "--standalone",
        f"--metadata=title:{item['title']}",
        "-o",
        html_file,
    ]
    subprocess.run(cmd_pandoc, check=True)

    # 2. Inject high-quality printable CSS into HTML
    with open(html_file, "r", encoding="utf-8") as f:
        html_content = f.read()

    if "</head>" in html_content:
        html_content = html_content.replace("</head>", f"{CSS_STYLE}</head>")
    else:
        html_content = f"{CSS_STYLE}\n{html_content}"

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"    [+] Created standalone HTML: {os.path.basename(html_file)}")

    # 3. If Chrome/Chromium exists, render directly to PDF
    if browser_path:
        print(f"    [*] Rendering to PDF via {os.path.basename(browser_path)}...")
        cmd_chrome = [
            browser_path,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_file}",
            html_file,
        ]
        try:
            subprocess.run(cmd_chrome, check=True, timeout=60)
            if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
                print(f"    [✔] Successfully generated PDF: {os.path.basename(pdf_file)} ({os.path.getsize(pdf_file):,} bytes)")
                return True
        except Exception as e:
            print(f"    [!] Browser PDF render warning: {e}")

    return False


def main():
    browser = find_browser()
    if browser:
        print(f"[*] Found browser engine: {browser}")
    else:
        print("[!] No headless Chrome/Chromium detected on PATH. HTML files will be created for 1-click printing.")

    for item in FILES:
        if not os.path.exists(item["md"]):
            print(f"[!] File not found: {item['md']}")
            continue
        convert_via_pandoc_and_browser(item, browser)

    print("\n[✔] Conversion process complete!")
    print("--------------------------------------------------")
    print("Output Files Available in Workspace Root:")
    for item in FILES:
        pdf_exists = os.path.exists(item["pdf"])
        status = "PDF Ready" if pdf_exists else "HTML Ready (Open & Print to PDF via Ctrl+P)"
        print(f" - {os.path.basename(item['pdf'] if pdf_exists else item['html'])} [{status}]")
    print("--------------------------------------------------")


if __name__ == "__main__":
    main()
