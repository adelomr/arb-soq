const puppeteer = require('puppeteer');

(async () => {
    console.log("Starting browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    console.log("Navigating to page...");
    await page.goto('http://localhost:3000/sooq-baladna', {waitUntil: 'networkidle2'});
    
    console.log("Waiting for ads grid...");
    await page.waitForSelector('.group.cursor-pointer', { timeout: 10000 });
    
    console.log("Clicking the first ad...");
    await page.evaluate(() => {
        document.querySelector('.group.cursor-pointer').click();
    });
    
    console.log("Waiting a bit to capture errors...");
    await new Promise(r => setTimeout(r, 2000));
    
    const hasNextError = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
    console.log("NextJS Error Overlay present:", hasNextError);
    
    await browser.close();
})();
