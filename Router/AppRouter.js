const express = require('express');
const AppRouter = express.Router();
const fetchProfileConsumer = require('../Middlewares/ConsumerProfileChecker');

AppRouter.get('/consumer-profile', fetchProfileConsumer, async (req, res) => {
    try {

        const data = req.cprofile;

        return res.status(200).json({ msg: "Hello app api", data: data });
    } catch (error) {
        console.error(`Error from fetching consumer profile ${error}`)
    }
})

module.exports = AppRouter;