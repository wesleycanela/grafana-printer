const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

app.post('/api/print', async (req, res) => {
    const { targetUrl, authHeader, waitTime = 5000 } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'The targetUrl parameter is required' });
    }

    let browser = null;
    try {
        console.log(`[API] Starting capture for: ${targetUrl}`);

        // Optimized initialization with Corporate Proxy Bypass
        browser = await chromium.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--proxy-bypass-list=127.0.0.1,localhost,172.*,10.*,192.168.*'
            ]
        });

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            extraHTTPHeaders: authHeader ? { 'Authorization': authHeader } : {},
            ignoreHTTPSErrors: true
        });

        const page = await context.newPage();

        // Navigate to URL and wait until no new network requests (base load)
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });

        // Enhanced Lazy Loading Strategy: Progressive scroll
        console.log('[API] Executing paced auto-scroll to load hidden panels...');
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400; // Reduced distance to ensure Grafana visual trigger
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 400); // 400ms: Increased interval to allow container CPU processing
            });
        });

        console.log('[API] Scroll completed. Waiting for data queries resolution (Network Idle)...');
        // CRITICAL: Force Playwright to wait until there is no more network traffic (pending queries)
        try {
            await page.waitForLoadState('networkidle', { timeout: 15000 });
        } catch (e) {
            console.log('[API] Warning: Network timeout. A panel might be exceptionally slow. Proceeding...');
        }

        // Return to top before capture (prevents Grafana header layout breakage)
        await page.evaluate(() => window.scrollTo(0, 0));

        // Extra safety wait defined in n8n node (Canvas Rendering)
        await page.waitForTimeout(waitTime);

        // Capture full page
        console.log('[API] Generating screenshot...');
        const imageBuffer = await page.screenshot({ fullPage: true });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

        console.log('[API] Capture finished successfully.');
    } catch (error) {
        console.error('[API] Critical capture error:', error);
        res.status(500).json({
            error: 'Playwright rendering failure',
            details: error.message
        });
    } finally {
        // Guaranteed memory release
        if (browser) {
            await browser.close();
            console.log('[API] Chromium instance closed.');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rendering Microservice running on port ${PORT}`);
});
