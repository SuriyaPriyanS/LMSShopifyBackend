import express from "express";
import { shopify } from "../Utils/shopify.js";
import Shop from "../models/Shop.js";
import { Session } from "@shopify/shopify-api";

const router = express.Router();


router.get("/config", (req, res) => {
    res.json({
        apiKey: process.env.SHOPIFY_API_KEY,
    });
});


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
        const shop = req.query.shop;
        const code = req.query.code;

        if (!shop || !code) {
            throw new Error("Missing shop or code parameter");
        }

        console.log("Exchanging code for access token...");
        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_API_KEY,
                client_secret: process.env.SHOPIFY_API_SECRET,
                code: code,
            }),
        });

        if (!tokenResponse.ok) {
            const errBody = await tokenResponse.text();
            throw new Error(`Failed to exchange token: ${errBody}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        console.log("Access token received. Creating session...");
        const offlineId = `offline_${shop}`;
        const session = new Session({
            id: offlineId,
            shop,
            state: "active",
            isOnline: false,
            accessToken: accessToken,
            scope: tokenData.scope || process.env.SCOPES,
        });

        // Store the session in MongoDB Session Storage
        await shopify.config.sessionStorage.storeSession(session);

        // Also save shop to ShopModel
        await Shop.findOneAndUpdate(
            { shop },
            {
                shop,
                accessToken,
                installedAt: new Date(),
                uninstalledAt: null,
            },
            {
                upsert: true,
                new: true,
            }
        );

        console.log("Shop and session saved to MongoDB");

        // Register webhooks
        await shopify.webhooks.register({
            session,
        });

        console.log("Webhooks registered");

        const shopifyApiKey = process.env.SHOPIFY_API_KEY;

        return res.redirect(
            `https://${shop}/admin/apps/${shopifyApiKey}`
        );

    } catch (error) {
        console.error(
            "Auth callback failed:",
            error
        );

        if (!res.headersSent) {
            return res.status(500).send(
                `Authentication failed: ${error.message}. Received Cookies: [${req.headers.cookie || "none"}]. Try installing the app again.`
            );
        }
    }
});

export default router;