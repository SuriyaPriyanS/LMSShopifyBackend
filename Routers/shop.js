import express from "express";
import {shopify} from "../Utils/shopify.js";


const router = express.Router();

router.get("/shop-info", async (req,res) => {

     console.log("Shopify session:", req.shopifySession);
    try {
         console.log("Shopify session:", req.shopifySession);
        const client = new shopify.clients.Graphql({session: req.shopifySession});
        
        const response = await client.request(`
            query{
            shop {
            name
            email
            myshopifyDomain
            plan {displayName}
            currencyCode
            }
            }`);
            res.json({shop: response.data.shop});

    }
    catch (error) {
      console.log("Shop information validation", error);
      res.status(502).json({error: "failed to reach Shopify Admin Api"});
    }
});

router.get("/shopify-customers", async (req, res) => {
    try {
        const client = new shopify.clients.Graphql({session: req.shopifySession});
        const response = await client.request(`

            query {
            customers(first:25, sortKey: CREATED_AT, reverse: true) {
            edges {
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
        console.log("Shopify customers mismatch", error);
        res.status(502).json({error: "failed to reach Shopify Admin Api"})
    }
});

export default router;