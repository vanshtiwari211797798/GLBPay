require("dotenv").config();
const ConsumerModel = require('../Models/ConsumerModel');
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');

const fetchProfileConsumer = async (req, res, next) => { 
    try { 
        const token = req.header('Authorization');

        if (!token) {
            return res.status(401).json({ msg: "Unauthorized access, token not be provided" })
        }

        const jwt_token = token.replace("Bearer ", "");
        const is_verify = jwt.verify(jwt_token, SECRET_KEY);

        console.log("🔍 Decoded token:", is_verify);

        // ✅ Password bhi le lo (select({ password: 0 }) hatao)
        const fetchData = await ConsumerModel.findOne({ email: is_verify.email }).select({ password: 0 });
        // ❌ Pehle: .select({ password: 0 }) - isme password nahi aata tha

        console.log("👤 Consumer found:", fetchData ? fetchData.name : "Not found");
        console.log("🔑 Password in DB:", fetchData ? fetchData.password : "No password");

        if (!fetchData) {
            return res.status(404).json({ msg: "Consumer not found" });
        }

        req.cprofile = fetchData;
        next();
    } catch (error) {
        console.error(`Error from fetching the consumer details: ${error}`);
        return res.status(401).json({ msg: "Invalid token", error: error.message });
    }
}

module.exports = fetchProfileConsumer;