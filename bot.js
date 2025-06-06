require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // для загрузки файла
const pTimeout = require('p-timeout');
const { readExcelFromBuffer } = require('./excelReader');
const { loginEmaktab } = require('./loginAutomation');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply('🤖 Я запущен!\n\n📤 Пожалуйста, отправьте ваш Excel файл (в формате `.xlsx`).\n\nℹ️ Чтобы посмотреть пример правильного файла, нажмите 👉 /example');
});

bot.command('example', async (ctx) => {
    await ctx.reply('📄 *Пример правильного Excel файла*:\n\n1️⃣ Файл должен быть в формате `.xlsx`\n2️⃣ Столбцы должны называться: `login` и `password`\n3️⃣ 📷 Пример на изображении ниже 👇');
    await ctx.replyWithPhoto({ source: './example.jpg' });
});

bot.on('document', async (ctx) => {
    if (!ctx.from) {
        console.log('ctx.from отсутствует!');
        return;
    }

    const file = ctx.message.document;

    if (!file.file_name.endsWith('.xlsx')) {
        return ctx.reply("⚠️ Пожалуйста, отправьте файл в формате `.xlsx`");
    }

    try {
        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        const response = await fetch(fileLink.href);
        const buffer = await response.arrayBuffer();

        const data = readExcelFromBuffer(buffer);
        const userId = ctx.from?.id || 'неизвестный';

        if (data.length > 30) {
            console.log(`❌ Пользователь ${userId} пытался отправить больше 30 логинов!`);
            return ctx.reply(`❌ В файле слишком много логинов: ${data.length} (Максимум 30). Пожалуйста, сократите список.`);
        }

        console.log('Данные из Excel:', data);

        const failedLogins = [];

        for (let row of data) {
            const login = row.login || row.логин;
            const password = String(row.password || row.пароль); // переводим в строку

            if (login && password) {
                try {
                    const success = await pTimeout(
                        loginEmaktab(login, password),
                        60000, // 60 секунд
                        `⏳ Тайм-аут при попытке входа для ${login}`
                    );

                    if (!success) {
                        failedLogins.push(login);
                    }

                } catch (err) {
                    console.error(`⛔ Ошибка при входе для ${login}:`, err.message);
                    failedLogins.push(login);
                }
            }
        }

        if (failedLogins.length > 0) {
            ctx.reply(`❌ Не удалось войти в аккаунты:\n${failedLogins.join('\n')}\n\n✅ Остальные аккаунты были успешно обработаны.`);
        } else {
            ctx.reply(`✅ Все аккаунты успешно обработаны.`);
        }

    } catch (err) {
        console.error('❌ Ошибка при обработке Excel:', err);
        ctx.reply('❌ Произошла ошибка при чтении или обработке файла.');
    }
});

bot.launch();
