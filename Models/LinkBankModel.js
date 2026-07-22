const mongoose = require('mongoose');

const LinkBankSchema = new mongoose.Schema({
    consumer_id: {
        type: String,
        required: true
    },
    bank_name: {
        type: String,
        required: true
    },
    account_no: {
        type: String,
        required: true
    },
    ifsc_code: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    holder_name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const LinkBankModel = mongoose.model("linkbank", LinkBankSchema);
module.exports = LinkBankModel;