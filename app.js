const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();
const path = require('path'); // Import the 'path' module

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve static files from the 'public' folder


async function getGoogleRanking(query, websiteUrl) {
  try {
    const browser = await puppeteer.launch({ headless: true }); // Headless mode
    const page = await browser.newPage();

    const queryFormatted = query.replace(' ', '+');
    const googleUrl = `https://www.google.com/search?q=${queryFormatted}`;

    await page.goto(googleUrl);
    await page.waitForSelector('.tF2Cxc');

    const searchResults = await page.$$('.tF2Cxc');

    for (let index = 0; index < searchResults.length; index++) {
      const result = searchResults[index];
      const resultUrl = await result.$eval('a', (el) => el.href);

      if (resultUrl.includes(websiteUrl)) {
        await browser.close();
        return index + 1; // Adding 1 to make it human-readable (1-based index)
      }
    }

    await browser.close();
  } catch (error) {
    console.log(`An error occurred: ${error}`);
  }
  return null;
}

app.post('/check_ranking', async (req, res) => {
  const query = req.body.query;
  const websiteUrl = req.body.website_url;

  const ranking = await getGoogleRanking(query, websiteUrl);

  const message = ranking ?
    `The website ${websiteUrl} is ranked #${ranking} on Google for the query '${query}'.` :
    `The website ${websiteUrl} is not found in the search results for the query '${query}'.`;

  res.json({ message });
});
// Route handler for the root URL ("/")
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Send the index.html file
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
