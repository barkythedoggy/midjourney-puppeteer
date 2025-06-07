const express = require('express');
const puppeteer = require('puppeteer');

require('dotenv').config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.post('/prompt', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send('Missing prompt');

  const channelURL = process.env.DISCORD_CHANNEL_URL;
  const email = process.env.DISCORD_EMAIL;
  const password = process.env.DISCORD_PASSWORD;

  if (!channelURL || !email || !password) {
    return res.status(500).send('Missing environment variables');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    await page.goto(channelURL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);

    await page.keyboard.type(`/imagine prompt: ${prompt}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    await browser.close();
    res.send('Prompt sent successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to send prompt');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
