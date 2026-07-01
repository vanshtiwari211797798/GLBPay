const mongoose = require('mongoose');

const SavingSchema = new mongoose.Schema({
    branch: {
        type: String,
        required: true
    },
    membership_id: {
        type: Number,
        required: true
    },
    account_holder: {
        type: String,
        required: true
    },
    father_husband: {
        type: String,
        required: true
    },
    dob: {
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
    occupation: {
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
    address: {
        type: String,
        required: true
    },
    aadhar: {
        type: String,
        required: true
    },
    pan: {
        type: String,
    },
    voter: {
        type: String,
    },
    initital_d: {
        type: String,
        required: true
    },
    minimum_d: {
        type: String,
        required: true
    },
    interest: {
        type: String,
        required: true
    },
    opening_date: {
        type: String,
        required: true
    },
    nominee_name: {
        type: String,
        required: true
    },
    relation: {
        type: String,
        required: true
    },
    n_dob: {
        type: String,
        required: true
    },
    n_contact: {
        type: String,
        required: true
    },
    a_name: {
        type: String,
        required: true
    },
    a_code: {
        type: Number,
        required: true
    },
    saving_number: {
        type: Number,
        required: true
    },
})


const SavingModel = new mongoose.model("saving", SavingSchema);
module.exports = SavingModel;