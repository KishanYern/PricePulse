from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Navigate to the registration page and take a screenshot
    page.goto("http://localhost:5173/register")
    page.screenshot(path="jules-scratch/verification/register_page.png")

    # Navigate to the login page and take a screenshot
    page.goto("http://localhost:5173/login")
    page.screenshot(path="jules-scratch/verification/login_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
