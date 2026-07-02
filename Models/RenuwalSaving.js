const mongoose = require('mongoose');

const RenuwalSavingSchema = new mongoose.Schema({
    accountno: {
        type: String,
        required: true
    },
    holdername: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    deposit_amount: {
        type: Number,
        required: true
    },
    deposit_by: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

const newRenuwalSavingModel = new mongoose.model("savingrenuwals", RenuwalSavingSchema);
module.exports = newRenuwalSavingModel;