import express from "express";
import {shopify} from "../Utils/shopify.js";


const router = express.Router();

router.get("/shop-info", async (req,res) => {
    try {
         console.log("Shopify session:", req.shopifySession);
        const client = new shopify.clients.Graphql({session: req.shopifySession});
        
        const response = await client.request(`
            query{
            shop {
            name
            eamil
            myshopifyDomin
            plan {displayName}
            currencyCode
            }
            }`);
            res.json({shop: response.data.shop});

    }
    catch (error) {
      console.log("Shop information vlaidation", error);
      res.status(502).json({error: "faloited to reach shopfiy Admin Api"});
    }
});

router.get("/shopify-customers", async (req, res) => {
    try {
        const client = new shopify.clients.Graphql({session: req.shopifySession});
        const response = await client.request(`

            query {
            customers(first:25, sortkey: CREATED_AT ,reverse: true) {
            edge {
            node {
            id
            displayName
            email
            numberOfOrders
            }}}
            }
            `);
            const customers = response.data.customers.edges.map((e)=> e.node);
            res.json({customers});

    }
    catch (error) {
        console.log("Shopify customewrs mismatch", error);
        res.status(502).json({error: "faliesd to reach Shopify Admin Api"})
    }
});

export default router;