const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/sooq-baladna');
    
    // Wait for ads to load (grid)
    await page.waitForSelector('.group.cursor-pointer', { timeout: 10000 });
    
    // Click the first ad
    await page.click('.group.cursor-pointer');
    
    // Wait for the shorts view to appear
    await page.waitForSelector('.video-snap-item', { timeout: 5000 });
    
    // Get the HTML of the active video card
    const html = await page.evaluate(() => {
        const activeCard = document.querySelector('.video-snap-item');
        return activeCard ? activeCard.outerHTML : 'Not found';
    });
    
    console.log("=== HTML DUMP ===");
    console.log(html);
    
    // Check for Next.js error overlay
    const errorOverlay = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
    console.log("NextJS Error Overlay:", errorOverlay);
    
    await browser.close();
})();
