"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var UserSchema = new mongoose_1.Schema({
    userName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
});
var User = mongoose_1.models.User || mongoose_1.model("User", UserSchema);
exports["default"] = User;
