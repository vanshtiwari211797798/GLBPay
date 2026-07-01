require("dotenv").config();
const express = require('express');
const HomeRouter = require('./Router/HomeRouter');
const ConnectDB = require('./DB/db');
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // ✅ OPTIONS add karo
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // ✅ Headers add karo
    credentials: false,
    optionsSuccessStatus: 200
}

// middleware
app.use(cors(corsOptions));
app.use(express.json());


// routes
app.use('/api/home', HomeRouter);


const PORT = process.env.PORT || 5500;

ConnectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`App is listen on the port number ${PORT}`);
    })
})