"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var createadmin_module_css_1 = require("@/styles/components/superadminsidebar/createadmin.module.css");
var CreateAdmin = function () {
    var _a = react_1.useState(false), showPassword = _a[0], setShowPassword = _a[1];
    var _b = react_1.useState(false), isSuperAdmin = _b[0], setIsSuperAdmin = _b[1];
    var _c = react_1.useState(''), userName = _c[0], setUserName = _c[1];
    var _d = react_1.useState(''), email = _d[0], setEmail = _d[1];
    var _e = react_1.useState(''), password = _e[0], setPassword = _e[1];
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var data, res, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    data = {
                        userName: userName,
                        email: email,
                        password: password,
                        role: isSuperAdmin ? 'superadmin' : 'admin'
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('/api/createadmin', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    result = _a.sent();
                    if (res.ok) {
                        alert('Admin created successfully!');
                        setUserName('');
                        setEmail('');
                        setPassword('');
                        setIsSuperAdmin(false);
                        setShowPassword(false);
                    }
                    else {
                        alert(result.message || 'Failed to create admin.');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error creating admin:', error_1);
                    alert('Server error!');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (react_1["default"].createElement("div", { className: createadmin_module_css_1["default"].container },
        react_1["default"].createElement("h2", { className: createadmin_module_css_1["default"].heading }, "Create Admin"),
        react_1["default"].createElement("form", { className: createadmin_module_css_1["default"].form, onSubmit: handleSubmit },
            react_1["default"].createElement("div", { className: createadmin_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "userName" }, "Full Name"),
                react_1["default"].createElement("input", { type: "text", id: "userName", className: createadmin_module_css_1["default"].input, placeholder: "Enter full name", value: userName, onChange: function (e) { return setUserName(e.target.value); } })),
            react_1["default"].createElement("div", { className: createadmin_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "email" }, "Email"),
                react_1["default"].createElement("input", { type: "email", id: "email", className: createadmin_module_css_1["default"].input, placeholder: "Enter email", value: email, onChange: function (e) { return setEmail(e.target.value); } })),
            react_1["default"].createElement("div", { className: createadmin_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "password" }, "Password"),
                react_1["default"].createElement("input", { type: showPassword ? 'text' : 'password', id: "password", className: createadmin_module_css_1["default"].input, placeholder: "Enter password", value: password, onChange: function (e) { return setPassword(e.target.value); } })),
            react_1["default"].createElement("div", { className: createadmin_module_css_1["default"].checkboxGroup },
                react_1["default"].createElement("label", { className: createadmin_module_css_1["default"].checkboxLabel },
                    react_1["default"].createElement("input", { type: "checkbox", checked: showPassword, onChange: function () { return setShowPassword(!showPassword); } }),
                    "Show Password")),
            react_1["default"].createElement("div", { className: createadmin_module_css_1["default"].checkboxGroup },
                react_1["default"].createElement("label", { className: createadmin_module_css_1["default"].checkboxLabel },
                    react_1["default"].createElement("input", { type: "checkbox", checked: isSuperAdmin, onChange: function () { return setIsSuperAdmin(!isSuperAdmin); } }),
                    "Make Super Admin")),
            react_1["default"].createElement("button", { type: "submit", className: createadmin_module_css_1["default"].submitButton }, "Create"))));
};
exports["default"] = CreateAdmin;
