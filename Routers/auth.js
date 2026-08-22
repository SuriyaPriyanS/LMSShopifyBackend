import express from "express";
import {shopify} from "../Utils/shopify.js";
import Shop from "../models/Shop.js";


const router = express.Router();


router.get("/", async (req, res) => {
    const shop = req.query.shop;
    if(!shop) {
        return res.status(400).send("Missing shop parameter");
    }
    await shopify.auth.begin({
        shop: shopify.utils.sanitizeShop(shop, true),
        callbackPath: "/api/auth/callback",
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
    });
});

router.get("/callback", async (req, res) => {
    try{
        const callback = await shopify.auth.callback({
            rawRequest: req,
            rawResponse: res,
        });

        const {session} = callback;
        await Shop.findOneAndUpdate(
            {shop: session.shop},
            {shop: session.shop, installledAt: new Date(), uninstalledAt: null},
            {upsert: true, new: true}
        );

        await shopify.webhooks.register({session});

        const host = req.query.host;
        return res.redirect(`/?shop=${session.shop}$host=${host}`);
    }
    catch (errors) {
        console.log("auth/calback falied: ", errors);
        return res.status(500).send("Authenction failed try installing the app agin");
    }
});

export default router;



