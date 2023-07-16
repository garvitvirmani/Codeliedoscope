const puppeteer = require("puppeteer");
const chrome = require("chrome-aws-lambda");
const { NextApiRequest, NextApiResponse } = require("next");

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      executablePath: await chrome.executablePath,
      args: chrome.args,
      headless: chrome.headless,
    });

    const page = await browser.newPage();

    await page.goto("https://www.shoppersstop.com/store-finder");

    console.log("started...");

    await page.waitForSelector("#city-name", { timeout: 120000 });

    const cityOptions = await page.$$eval("#city-name option", (options) =>
      options.map((option) => option.value)
    );

    const cityStoreInfo = [];

    for (const cityOption of cityOptions) {
      await page.select("#city-name", cityOption);

      await page.waitForSelector("#selectedPOS option", { timeout: 120000 });

      const storeOptions = await page.$$eval("#selectedPOS option", (options) =>
        options.map((option) => option.value)
      );

      const stores = [];
      for (let storeOption of storeOptions) {
        storeOption = storeOption.split(",");
        await page.select("#selectedPOS", storeOption.at(-1));

        await page.waitForSelector(".store_address", { timeout: 120000 });

        const storeName = await page.$eval(
          ".store_address h3",
          (element) => element.textContent
        );
        const storeAddress = await page.$eval(
          ".store_address p",
          (element) => element.textContent
        );

        storeOption?.[0]?.length > 0 &&
          storeOption?.[1]?.length > 0 &&
          stores.push({
            name: storeName,
            latitude: storeOption?.[0],
            longitude: storeOption?.[1],
            address: storeAddress,
          });
      }

      cityStoreInfo.push({
        city: cityOption,
        stores: stores,
      });
    }

    await browser.close();

    res.status(200).json({ cityStoreInfo });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
