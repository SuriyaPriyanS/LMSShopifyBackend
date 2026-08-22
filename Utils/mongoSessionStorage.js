import SessionModel from "../models/Session.js";
import ShopModel from "../models/Shop.js";
import { Session } from "@shopify/shopify-api";


export class MongoSessionStorage {
    async storeSession(session) {
        const payload = session.toObject ? session.toObject() : {...session};
        await SessionModel.findOneAndUpdate(
            {id: session.id},
            {id: session.id, shop: session.shop, payload},
            {upsert: true, new: true}
        );

        if(session.shop) {
            await ShopModel.findOneAndUpdate(
                { shop: session.shop}, 
                {shop: session.shop, uninstalledAt: null},
                {upsert: true, new: true}
            );
        }
        return true;
    }

    async loadSession(id) {
        const doc = await SessionModel.findOne({id});
        if(!doc) return undefined;
        return new Session(doc.payload);
    }

    async deleteSession(id) {
        await SessionModel.deleteOne({id});
        return true;
    }

    async deleteSessions(ids) {
        await SessionModel.deleteMany({id: {$in: ids}});
        return true;
    }

    async findSessionsByShop(shop) {
        const docs = await SessionModel.find({shop});
        return docs.map((d) => new Session(d.payload));
    }
}

export default MongoSessionStorage;