const mongoose = require('mongoose');

const consumerSchema = new mongoose.Schema({
    photo: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    father: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    merital: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    aadhar: {
        type: String,
        required: true
    },
    pan: {
        type: String,
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    present_address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    bank: {
        type: String,
        required: true
    },
    accountholder: {
        type: String,
        required: true
    },
    accountno: {
        type: String,
        required: true
    },
    ifsc: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    doa: {
        type: String,
        required: true
    },
    nos: {
        type: String,
        required: true
    },
    share_value: {
        type: Number,
        required: true
    },
    membership_no: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    }
},{
    timestamps:true
})

const ConsumerModel = new mongoose.model("consumers", consumerSchema);
module.exports = ConsumerModel;