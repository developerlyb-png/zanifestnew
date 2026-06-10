"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// models/Counter.js
var counterSchema = new _mongoose["default"].Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    "default": 0
  }
});

var Counter = _mongoose["default"].models.Counter || _mongoose["default"].model('Counter', counterSchema);

var _default = Counter;
exports["default"] = _default;