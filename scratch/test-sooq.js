const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log("Navigating to local site...");
  await page.goto('http://localhost:3000/sooq-baladna', { waitUntil: 'domcontentloaded' });
  
  console.log("Waiting for grid ads to render...");
  await page.waitForSelector('.group.cursor-pointer', { timeout: 10000 });
  
  const initialHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('initial_body.html', initialHTML);
  console.log("Saved initial body HTML to initial_body.html");

  console.log("Clicking the first ad card...");
  // We click the first visible ad
  await page.click('.group.cursor-pointer:first-of-type');
  
  // Wait a bit to let React transition the viewMode
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'after_click.png', fullPage: true });
  console.log("Took screenshot after click.");
  
  const finalHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('final_body.html', finalHTML);
  console.log("Saved final body HTML to final_body.html");
  
  await browser.close();
})();
