const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    agentcode: {
        type: Number,
        required: true
    }
})

const AgentModel = new mongoose.model("agents", AgentSchema);
module.exports = AgentModel;