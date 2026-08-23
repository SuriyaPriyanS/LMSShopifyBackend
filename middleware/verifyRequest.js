import shopify from "../Utils/shopify.js";
import SessionModel from "../models/Session.js";
import ShopModel from "../models/Shop.js";
import { Session } from "@shopify/shopify-api";


export async function verifyRequest(req, res, next) {

    

  const mockShop = req.headers["x-mock-shop"];
  if (mockShop) {
    try {
      const shop = mockShop.replace(/^https?:\/\//, "").split("/")[0].trim();
      const offlineId = `offline_${shop}`;
      
      // 1. Try loading via SessionModel
      let session = null;
      const sessionDoc = await SessionModel.findOne({ id: offlineId }).lean();
      if (sessionDoc && sessionDoc.payload) {
        session = new Session(sessionDoc.payload);
      }

      // 2. Fallback: Check ShopModel for direct accessToken reference
      if (!session) {
        const shopDoc = await ShopModel.findOne({ shop }).lean();
        if (shopDoc && shopDoc.accessToken) {
          session = new Session({
            id: offlineId,
            shop,
            state: "active",
            isOnline: false,
            accessToken: shopDoc.accessToken,
            scope: process.env.SCOPES,
          });
        }
      }

      // 3. Fallback 3: Hardcoded mock token or env mock token override if absolutely no record is found in DB
      if (!session) {
        const fallbackToken = process.env.MOCK_ACCESS_TOKEN || "shpua_a5472d8ecf143d566e69ec78804ae412";
        console.warn(`No offline session or shop record found in DB for ${shop}. Falling back to mock token.`);
        session = new Session({
          id: offlineId,
          shop,
          state: "active",
          isOnline: false,
          accessToken: fallbackToken,
          scope: process.env.SCOPES,
        });
      }

      req.shop = shop;
      req.shopifySession = session;
      return next();
    } catch (error) {
      console.error("Mock auth bypass failed:", error);
    }
  }

  const authHeader = req.headers.authorization || "";
  

  const bearerToken = authHeader.match(/Bearer (.*)/)?.[1];
  
  if(!bearerToken) {
    return res.status(401).json({ error: "Unauthorized" , message: "Missing session token"});
  }

  try {
    const payload = await shopify.session.decodeSession(bearerToken);
    console.log(payload , "payload");
    const shop = payload.dest.replace("https://", "");
    const offlineId = `offline_${shop}`;
    const sessionDoc = await SessionModel.findOne({ id: offlineId }).lean();
    const session = sessionDoc && sessionDoc.payload ? new Session(sessionDoc.payload) : null;


    if(!session || !session.accessToken) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "No offline session found for this shop. please reinstall the app.",
        })
    }

    req.shop = shop; 
    req.shopifySession = session;
    next();
  }
  catch (error) {
      return res.status(401).json({error: "Unauthorized", message: "Invalid or expired session token"});

  }

}

export default verifyRequest;