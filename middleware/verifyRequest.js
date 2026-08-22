import shopify from "../Utils/shopify.js";
import SessionModel from "../models/Session.js";


export async function verifyRequest(req, res, next) {

    

  // Development Bypass for Postman Testing (loads offline session, or creates a mock fallback if not yet installed)
  const mockShop = req.headers["x-mock-shop"];
  if (mockShop) {
    try {
      const shop = mockShop.replace(/^https?:\/\//, "").split("/")[0].trim();
      const offlineId = shopify.session.getOfflineId(shop);
      let session = await SessionModel.findOne({ id: offlineId }).lean();
      
      if (!session) {
        session = {
          id: offlineId,
          shop: shop,
          payload: {
            id: offlineId,
            shop: shop,
            accessToken: "shpua_a5472d8ecf143d566e69ec78804ae412",
            state: "active"
          }
        };
      }

      const accessToken = session.payload?.accessToken || session.accessToken;
      if (accessToken) {
        req.shop = shop;
        req.shopifySession = session.payload ? session.payload : session;
        return next();
      }
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
    const offlineId = shopify.session.getOfflineId(shop);
    const session = await shopify.sessionStorage.loadSession(offlineId);


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