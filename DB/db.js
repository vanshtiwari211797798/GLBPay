require("dotenv").config();
const mongoose = require('mongoose');

const DB_URL = process.env.DB_URL;

const ConnectDB = async () =>{
    try {
        await mongoose.connect(DB_URL);
        console.error(`Database Connected successfully !`)
    } catch (error) {
        process.exit(0);
        console.error(`Error from the db connection and error is the ${error}`);
    }
}

module.exports = ConnectDB;