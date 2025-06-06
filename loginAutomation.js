const puppeteer = require('puppeteer');

async function loginEmaktab(login, password) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://login.emaktab.uz/', { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('[data-test-id="login-field"]', { timeout: 10000 });
        await page.type('[data-test-id="login-field"]', login);

        await page.waitForSelector('[data-test-id="password-field"]', { timeout: 10000 });
        await page.type('[data-test-id="password-field"]', password);

        await Promise.all([
            page.click('input[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        const loginStillVisible = await page.$('[data-test-id="login-field"]');
        const errorText = await page.$eval('[data-test-id="error-message"]', el => el.textContent).catch(() => null);

        if (typeof errorText === 'string' && errorText.trim()) {
            console.log(`❌ Ошибка входа для ${login}: ${errorText.trim()}`);
            return false;
        } else if (loginStillVisible) {
            console.log(`❌ Ошибка входа для ${login}: Неверный логин или пароль`);
            return false;
        } else {
            console.log(`✅ Успешный вход: ${login}`);
            return true;
        }

    } catch (error) {
        console.error(`❌ Ошибка Puppeteer для ${login}:`, error.message);
        return false;
    } finally {
        await browser.close();
    }
}

module.exports = { loginEmaktab };
