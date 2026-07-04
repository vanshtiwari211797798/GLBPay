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

        //if token received from the headers then
        const jwt_token = token.replace("Bearer ", "");
        const is_verify = jwt.verify(jwt_token, SECRET_KEY);

        const fetchData = await ConsumerModel.findOne({email:is_verify.email}).select({password:0});
        req.cprofile = fetchData;
        next();
    } catch (error) {
        console.error(`Error from fetching the consumer details and error is the ${error}`);
    }
}

module.exports = fetchProfileConsumer;