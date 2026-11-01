import asyncio
import os
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "demo_data/screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            color_scheme="dark"
        )
        page = await context.new_page()

        # ----------------------------------------------------------------------
        # 03_most_wanted.png
        # ----------------------------------------------------------------------
        print("Capturing 03_most_wanted.png...")
        await page.goto("http://localhost:5173/most-wanted", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        # Ensure dark class is active
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        # Ensure Court XAI Audit toggle is turned on if present
        try:
            xai_toggle = await page.query_selector("button:has-text('Court XAI'), input[type='checkbox']")
            if xai_toggle:
                await xai_toggle.click()
                await page.wait_for_timeout(500)
        except Exception as e:
            print("XAI toggle check:", e)
        await page.screenshot(path=f"{OUTPUT_DIR}/03_most_wanted.png")

        # ----------------------------------------------------------------------
        # 05_smurfing_alert.png (Dashboard)
        # ----------------------------------------------------------------------
        print("Capturing 05_smurfing_alert.png...")
        await page.goto("http://localhost:5173/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        await page.screenshot(path=f"{OUTPUT_DIR}/05_smurfing_alert.png")

        # ----------------------------------------------------------------------
        # 06_lite_mode.png
        # ----------------------------------------------------------------------
        print("Capturing 06_lite_mode.png...")
        await page.goto("http://localhost:5173/lite", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        lite_path = f"{OUTPUT_DIR}/06_lite_mode.png"
        await page.screenshot(path=lite_path)

        # Annotate 06_lite_mode with red circle "200 KB"
        try:
            img = Image.open(lite_path).convert("RGBA")
            draw = ImageDraw.Draw(img)
            # Draw red circle banner / badge at top right
            cx, cy, r = 1650, 80, 55
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(220, 38, 38, 255), width=5, fill=(15, 23, 42, 220))
            # Text "200 KB"
            draw.text((cx - 32, cy - 14), "200 KB", fill=(239, 68, 68, 255))
            draw.text((cx - 38, cy + 8), "Bundle Size", fill=(255, 255, 255, 220))
            img.convert("RGB").save(lite_path, format="PNG")
            print("Annotated 06_lite_mode.png with red circle badge")
        except Exception as e:
            print("Annotation error:", e)

        # ----------------------------------------------------------------------
        # 07_anpr_map.png
        # ----------------------------------------------------------------------
        print("Capturing 07_anpr_map.png...")
        await page.goto("http://localhost:5173/map", wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        # Try to trigger camera zoom / popup if button exists
        try:
            toll_btn = await page.query_selector("button:has-text('Toll'), button:has-text('Yamuna'), button:has-text('Camera')")
            if toll_btn:
                await toll_btn.click()
                await page.wait_for_timeout(1000)
        except Exception as e:
            print("Map interaction note:", e)
        await page.screenshot(path=f"{OUTPUT_DIR}/07_anpr_map.png")

        # ----------------------------------------------------------------------
        # 02_network_graph.png
        # ----------------------------------------------------------------------
        print("Capturing 02_network_graph.png...")
        await page.goto("http://localhost:5173/network-graph", wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        await page.screenshot(path=f"{OUTPUT_DIR}/02_network_graph.png")

        # ----------------------------------------------------------------------
        # 08_time_travel_audit.png
        # ----------------------------------------------------------------------
        print("Capturing 08_time_travel_audit.png...")
        await page.goto("http://localhost:5173/network-graph?case=FIR-2026-CRIME-890&at=2026-03-14T18:30:00Z", wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        await page.screenshot(path=f"{OUTPUT_DIR}/08_time_travel_audit.png")

        await browser.close()
        print("All live screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture())
