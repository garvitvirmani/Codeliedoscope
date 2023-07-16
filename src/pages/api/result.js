const CDP = require("chrome-remote-interface");
const { NextApiRequest, NextApiResponse } = require("next");

export default async function handler(req, res) {
  try {
    const client = await CDP();

    const { DOM, Page } = client;

    await Promise.all([DOM.enable(), Page.enable()]);

    await Page.navigate({ url: "https://www.shoppersstop.com/store-finder" });

    await Page.loadEventFired();

    const cityOptions = await DOM.querySelectorAll({
      nodeId: DOM.getDocument().root.nodeId,
      selector: "#city-name option",
    });

    const cityStoreInfo = [];

    for (const cityOption of cityOptions.nodeIds) {
      const cityValue = await DOM.getAttribute({
        nodeId: cityOption,
        name: "value",
      });

      await DOM.setAttributeValue({
        nodeId: cityOption,
        name: "selected",
        value: "true",
      });

      await client.send("Input.selectOption", {
        options: [{ value: cityValue }],
      });

      await Page.waitForSelector("#selectedPOS option");

      const storeOptions = await DOM.querySelectorAll({
        nodeId: DOM.getDocument().root.nodeId,
        selector: "#selectedPOS option",
      });

      const stores = [];

      for (const storeOption of storeOptions.nodeIds) {
        const storeValue = await DOM.getAttribute({
          nodeId: storeOption,
          name: "value",
        });

        await DOM.setAttributeValue({
          nodeId: storeOption,
          name: "selected",
          value: "true",
        });

        await client.send("Input.selectOption", {
          options: [{ value: storeValue }],
        });

        await Page.waitForSelector(".store_address");

        const storeName = await DOM.querySelector({
          nodeId: DOM.getDocument().root.nodeId,
          selector: ".store_address h3",
        });

        const storeAddress = await DOM.querySelector({
          nodeId: DOM.getDocument().root.nodeId,
          selector: ".store_address p",
        });

        const name = await DOM.getOuterHTML({ nodeId: storeName.nodeId });
        const address = await DOM.getOuterHTML({ nodeId: storeAddress.nodeId });

        stores.push({
          name: name.substring(1, name.length - 1),
          latitude: storeValue.split(",")?.[0] || "",
          longitude: storeValue.split(",")?.[1] || "",
          address: address.substring(1, address.length - 1),
        });
      }

      cityStoreInfo.push({
        city: cityValue,
        stores,
      });
    }

    await client.close();

    res.status(200).json({ cityStoreInfo });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
