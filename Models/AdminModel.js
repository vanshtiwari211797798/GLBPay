const mongoose = require('mongoose');

const adminModel = new mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    }
})


const AdminModel = new mongoose.model("admins",adminModel);
module.exports = AdminModel;
