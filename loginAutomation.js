const puppeteer = require('puppeteer');

async function loginEmaktab(login, password) {
    const browser = await puppeteer.launch({ headless: true}); 
    const page = await browser.newPage();

    try {
        await page.goto('https://login.emaktab.uz/', { waitUntil: 'domcontentloaded' });

        
        await page.waitForSelector('[data-test-id="login-field"]', { timeout: 10000 });
        await page.waitForSelector('[data-test-id="password-field"]', { timeout: 10000 });
 
        await page.type('[data-test-id="login-field"]', login);
        await page.type('[data-test-id="password-field"]', password);

        
        await Promise.all([
            page.click('input[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);
 
        const stillOnLoginPage = await page.$('[data-test-id="login-field"]');
        const errorText = await page.$eval('.invalid-feedback', el => el.textContent).catch(() => null);

        if (stillOnLoginPage || errorText) {
            console.log(`❌ Ошибка входа для ${login}: ${errorText?.trim() || 'Неверный логин или пароль'}`);
        } else {
            console.log(`✅ Успешный вход: ${login}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

    } catch (error) {
        console.error(`❌ Ошибка Puppeteer для ${login}:`, error.message);
    } finally {
        await browser.close();
    }
}

module.exports = { loginEmaktab };
