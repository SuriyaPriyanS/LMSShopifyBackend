import express from "express";
import { shopify} from "../Utils/shopify.js";
import Shop from "../models/Shop.js";
import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";

const router = express.Router();

shopify.webhooks.addHandlers({
    APP_UNINSTALLED: {
        deliveryMethod: "http",
        callbackUrl: "/api/webhooks",
        callback: async (topic , shop) => {
            console.log(`webhook ${topic} for ${shop}`);
            await Shop.findOneAndUpdate({shop} , {uninstalledAt: new Date()});

            const courses = await Coures.find({shop} , "_id");
            await Enrollment.deleteMany({shop});
            await Course.deleteMany({shop});
            await Student.deleteMany({shop});
        },
    },
    CUSTOMERS_DATA_REQUEST: {
        deliveryMethod: "http",
        callbackUrl: "/api/webhooks",
        callback: async (topic, shop, body) => {
            console.log(`webhook ${topic} for ${shop}: customer data request logged`);
        },

    },
    CUSTOMERS_REDACT: {
        deliveryMethod: "http",
        callbackUrl: "/api/webhooks",
        callback: async (topic, shop, body) => {
            console.log(`Webhook ${topic} for ${shop}: customer redact requested`);
        },
    },
    SHOP_REDACT: {
        deliveryMethod : "http",
        callbackUrl: "api/webhooks",
        callback : async (topic , shop) => {
            console.log(`webhook ${topic} for ${shop}: shop redact requested`);
            await Enrollment.deleteMany({shop}),
            await Course.deleteMany({shop});
            await Student.deleteMany({shop});
            await Shop.deleteMany({shop});
        },
    }
});

router.post("/", async (req, res) => {
    try {
        await shopify.webhooks.process({rawbody: req.rawbody, rawRequest: req, rawResponse: res});

    }
    catch(error) {
        console.log(`webhook processing failed`, error);
        if(!res.headersSent) res.status(500).send();
    }
})
export default router;