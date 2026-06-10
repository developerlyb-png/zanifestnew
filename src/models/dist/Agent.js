"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var agentSchema = new mongoose_1["default"].Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    district: {
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
    password: {
        type: String,
        required: true
    },
    assignedTo: {
        type: String,
        required: true
    }
});
exports["default"] = mongoose_1["default"].models.Agent || mongoose_1["default"].model("Agent", agentSchema);
