import express from "express";
import { shopify } from "../Utils/shopify.js";
import Shop from "../models/Shop.js";

const router = express.Router();


router.get("/config", (req, res) => {
    res.json({
        apiKey: process.env.SHOPIFY_API_KEY,
    });
});


function parseSetCookie(cookieStr) {
    const parts = cookieStr.split(";");
    const [namePair, ...attrPairs] = parts;
    const eqIdx = namePair.indexOf("=");
    if (eqIdx === -1) return null;
    const name = namePair.substring(0, eqIdx).trim();
    const val = namePair.substring(eqIdx + 1).trim();

    const options = {};
    for (const attr of attrPairs) {
        const trimmed = attr.trim();
        const lowerTrimmed = trimmed.toLowerCase();
        if (lowerTrimmed === "secure") {
            options.secure = true;
        } else if (lowerTrimmed === "httponly") {
            options.httpOnly = true;
        } else if (lowerTrimmed.startsWith("samesite=")) {
            const sameSiteVal = trimmed.split("=")[1].trim().toLowerCase();
            options.sameSite = sameSiteVal === "none" ? "none" : sameSiteVal;
        } else if (lowerTrimmed.startsWith("path=")) {
            options.path = trimmed.split("=")[1].trim();
        } else if (lowerTrimmed.startsWith("max-age=")) {
            options.maxAge = parseInt(trimmed.split("=")[1].trim(), 10) * 1000;
        } else if (lowerTrimmed.startsWith("expires=")) {
            options.expires = new Date(trimmed.split("=")[1].trim());
        }
    }
    return { name, val, options };
}

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

        const originalSetHeader = res.setHeader.bind(res);
        res.setHeader = function (name, value) {
            if (name.toLowerCase() === "set-cookie") {
                const cookieArray = Array.isArray(value) ? value : [value];
                for (const cookieStr of cookieArray) {
                    try {
                        const parsed = parseSetCookie(cookieStr);
                        if (parsed) {
                            res.cookie(parsed.name, parsed.val, parsed.options);
                        }
                    } catch (err) {
                        console.error("Failed to parse and set cookie:", err);
                    }
                }
                return res;
            }
            return originalSetHeader(name, value);
        };

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

        // Inject matching state cookie into headers to bypass cookie-folding or SameSite blocks in serverless env
        if (req.query.state) {
            const stateCookie = `shopify_app_state=${req.query.state}`;
            if (req.headers.cookie) {
                req.headers.cookie = `${req.headers.cookie}; ${stateCookie}`;
            } else {
                req.headers.cookie = stateCookie;
            }
        }

        const originalSetHeader = res.setHeader.bind(res);
        res.setHeader = function (name, value) {
            if (name.toLowerCase() === "set-cookie") {
                const cookieArray = Array.isArray(value) ? value : [value];
                for (const cookieStr of cookieArray) {
                    try {
                        const parsed = parseSetCookie(cookieStr);
                        if (parsed) {
                            res.cookie(parsed.name, parsed.val, parsed.options);
                        }
                    } catch (err) {
                        console.error("Failed to parse and set cookie:", err);
                    }
                }
                return res;
            }
            return originalSetHeader(name, value);
        };

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

        const shopifyApiKey = process.env.SHOPIFY_API_KEY;

        return res.redirect(
            `https://${session.shop}/admin/apps/${shopifyApiKey}`
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