import {MongoSessionStorage} from "./mongoSessionStorage.js";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";
import dotenv from "dotenv";

dotenv.config();

const host =(process.env.HOST || "").replace(/^https?:\/\//, "");

console.log("HOST:", process.env.HOST);
console.log("SHOPIFY HOST:", host);



export const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SCOPES || "read_products, read_customers, write_products").split(","),
    hostName: host,
    hostScheme: process.env.HOST?.startsWith("https://") ? "https" : "http",
    apiVersion: ApiVersion.July26,
    isEmbeddedApp: true,
    sessionStorage: new MongoSessionStorage(),
});



export default shopify;