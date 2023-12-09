const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

async function getGoogleRanking(query, websiteUrl) {
  try {
    const browser = await puppeteer.launch();
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

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// http://localhost:3000/