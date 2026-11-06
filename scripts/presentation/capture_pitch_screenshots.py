import asyncio
import os
from playwright.async_api import async_playwright

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

        # 1. Log in as Field Investigator first to set auth state
        print("Logging in...")
        await page.goto("http://127.0.0.1:5173/login", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        try:
            btn = await page.query_selector("button:has-text('Field Investigator'), div:has-text('Field Investigator')")
            if btn:
                await btn.click()
                await page.wait_for_timeout(1500)
        except Exception as e:
            print("Login click note:", e)

        # 2. slide4_dashboard.png (Glassmorphic Dashboard)
        print("Capturing slide4_dashboard.png...")
        await page.goto("http://127.0.0.1:5173/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        await page.screenshot(path=f"{OUTPUT_DIR}/slide4_dashboard.png")

        # 3. slide2_smurfing.png (Smurfing Alert Element)
        print("Capturing slide2_smurfing.png...")
        alert_elem = await page.query_selector("#tour-alerts")
        if alert_elem:
            bbox = await alert_elem.bounding_box()
            if bbox:
                await page.screenshot(path=f"{OUTPUT_DIR}/slide2_smurfing.png", clip=bbox)
            else:
                await page.screenshot(path=f"{OUTPUT_DIR}/slide2_smurfing.png")
        else:
            await page.screenshot(path=f"{OUTPUT_DIR}/slide2_smurfing.png")

        # 4. slide2_graph.png (New Cytoscape Graph with Crimson Glow on Rajan)
        print("Capturing slide2_graph.png...")
        await page.goto("http://127.0.0.1:5173/network-graph", wait_until="networkidle")
        await page.wait_for_timeout(3500) # Wait for Cytoscape layout and node rendering
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        await page.screenshot(path=f"{OUTPUT_DIR}/slide2_graph.png")

        # 5. slide3_lite.png (Lite Mode Tabular View)
        print("Capturing slide3_lite.png...")
        await page.goto("http://127.0.0.1:5173/lite", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("() => document.documentElement.classList.add('dark')")
        await page.screenshot(path=f"{OUTPUT_DIR}/slide3_lite.png")

        await browser.close()
        print("All 4 screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture())
