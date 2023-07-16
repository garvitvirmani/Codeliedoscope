const puppeteer = require("puppeteer");

export default async function handler(req, res) {
  try {
    // Launch a headless browser in the new Headless mode
    const browser = await puppeteer.launch({ headless: "new" });

    // Open a new page
    const page = await browser.newPage();

    // Navigate to the website
    await page.goto("https://www.shoppersstop.com/store-finder");

    console.log("started...");

    // Wait for the necessary elements to load with a longer timeout (e.g., 120 seconds)
    await page.waitForSelector("#city-name", { timeout: 120000 });

    // Get the city options
    const cityOptions = await page.$$eval("#city-name option", (options) =>
      options.map((option) => option.value)
    );

    // Store the city and store information
    const cityStoreInfo = [];

    // Iterate through each city option
    for (const cityOption of cityOptions) {
      // Select a city
      await page.select("#city-name", cityOption);

      // Wait for the store names to load
      await page.waitForSelector("#selectedPOS option", { timeout: 120000 });

      // Get the store options
      const storeOptions = await page.$$eval("#selectedPOS option", (options) =>
        options.map((option) => option.value)
      );

      // Store the store names and addresses under the current city
      const stores = [];
      for (let storeOption of storeOptions) {
        storeOption = storeOption.split(",");
        // Select a store
        await page.select("#selectedPOS", storeOption.at(-1));

        // Wait for the store address to load
        await page.waitForSelector(".store_address", { timeout: 120000 });

        // Get the store name and address
        const storeName = await page.$eval(
          ".store_address h3",
          (element) => element.textContent
        );
        const storeAddress = await page.$eval(
          ".store_address p",
          (element) => element.textContent
        );

        // Store the store name and address in the array
        storeOption?.[0]?.length > 0 &&
          stores.push({
            name: storeName,
            latitude: storeOption?.[0],
            longitude: storeOption?.[1],
            address: storeAddress,
          });
      }

      // Store the city and stores in the array
      cityStoreInfo.push({
        city: cityOption,
        stores: stores,
      });
    }

    // Close the browser
    await browser.close();

    // Return the city and store information as the response
    res.status(200).json({ cityStoreInfo });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
