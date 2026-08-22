import shopify from "../Utils/shopify.js";


export async function verifyRequest(req, res, next) {

    

  const authHeader = req.headers.authorization || "";
  

  const bearerToken = authHeader.match(/Bearer (.*)/)?.[1];
  
  if(!bearerToken) {
    return res.status(401).json({ error: "Unauthorized" , message: "Misssing session token"});
  }

  try {
    const payload = await shopify.session.decodeSession(bearerToken);
    console.log(payload , "payload");
    const shop = payload.dest.replace("https://", "");
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