require('dotenv').config();
const { ApifyClient } = require('apify-client');

async function testApify(url) {
  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });

  console.log("Running Apify for", url);
  const input = {
    directUrls: [url],
    resultsType: "details",
    resultsLimit: 1,
    addParentData: false,
  };

  try {
    const run = await client.actor("apify/instagram-scraper").call(input);
    console.log("Run finished. Dataset ID:", run.defaultDatasetId);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log("Items:", items.length);
    if (items.length > 0) {
      console.log("Video URL:", items[0].videoUrl);
      console.log("Is Video:", items[0].isVideo);
      console.log("Type:", items[0].type);
    }
  } catch(err) {
    console.error("Error:", err);
  }
}

testApify('https://www.instagram.com/p/DZ99nwknV5m/');
