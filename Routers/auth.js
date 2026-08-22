import express from "express";
import { shopify } from "../Utils/shopify.js";
import Shop from "../models/Shop.js";

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const shop = shopify.utils.sanitizeShop(
            req.query.shop,
            true
        );

        if (!shop) {
            return res.status(400).send(
                "Invalid or missing Shopify shop"
            );
        }

        console.log("Starting OAuth for:", shop);

        await shopify.auth.begin({
            shop,
            callbackPath: "/api/auth/callback",
            isOnline: false,
            rawRequest: req,
            rawResponse: res,
        });

    } catch (error) {
        console.error("OAuth begin failed:", error);

        if (!res.headersSent) {
            return res.status(500).send(
                "Failed to start Shopify authentication"
            );
        }
    }
});


router.get("/callback", async (req, res) => {
    try {
        console.log("OAuth callback received");
        console.log("Shop:", req.query.shop);

        const callback = await shopify.auth.callback({
            rawRequest: req,
            rawResponse: res,
        });

        const { session } = callback;

        console.log("Authenticated shop:", session.shop);
        console.log(
            "Access token received:",
            !!session.accessToken
        );

        await Shop.findOneAndUpdate(
            { shop: session.shop },
            {
                shop: session.shop,
                accessToken: session.accessToken,
                installedAt: new Date(),
                uninstalledAt: null,
            },
            {
                upsert: true,
                new: true,
            }
        );

        console.log("Shop saved to MongoDB");

        await shopify.webhooks.register({
            session,
        });

        console.log("Webhooks registered");

        const host = req.query.host;

        return res.redirect(
            `/?shop=${session.shop}&host=${host}`
        );

    } catch (error) {
        console.error(
            "Auth callback failed:",
            error
        );

        if (!res.headersSent) {
            return res.status(500).send(
                "Authentication failed. Try installing the app again."
            );
        }
    }
});

export default router;