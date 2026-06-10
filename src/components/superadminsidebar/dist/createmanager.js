"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var createmanager_module_css_1 = require("@/styles/components/superadminsidebar/createmanager.module.css");
var CreateManager = function () {
    var _a = react_1.useState(''), selectedRole = _a[0], setSelectedRole = _a[1];
    var _b = react_1.useState({
        name: '',
        email: '',
        password: '',
        district: '',
        state: '',
        category: '',
        assignedTo: ''
    }), formData = _b[0], setFormData = _b[1];
    var _c = react_1.useState(false), showPassword = _c[0], setShowPassword = _c[1];
    var handleChange = function (e) {
        var _a = e.target, id = _a.id, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[id] = value, _a)));
        });
    };
    var handleRoleChange = function (e) {
        var value = e.target.value;
        setFormData(function (prev) { return (__assign(__assign({}, prev), { category: value })); });
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var assignedTo, response, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    assignedTo = null;
                    if (formData.category === 'district') {
                        // If assignedTo is stored as a string, no parsing needed
                        assignedTo = (_a = formData.assignedTo) === null || _a === void 0 ? void 0 : _a.trim();
                        if (!assignedTo) {
                            alert("Please select a valid state manager.");
                            return [2 /*return*/];
                        }
                    }
                    return [4 /*yield*/, fetch("/api/createmanager", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(__assign(__assign({}, formData), { assignedTo: assignedTo || null }))
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok)
                        throw new Error("Failed to create manager");
                    alert("Manager created successfully!");
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    console.error("Error:", err_1);
                    alert("Error creating manager");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].container },
        react_1["default"].createElement("h2", { className: createmanager_module_css_1["default"].heading }, "Create Manager"),
        react_1["default"].createElement("form", { className: createmanager_module_css_1["default"].form, onSubmit: handleSubmit },
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "name" }, "Full Name"),
                react_1["default"].createElement("input", { type: "text", id: "name", className: createmanager_module_css_1["default"].input, placeholder: "Enter full name", value: formData.name, onChange: handleChange })),
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "email" }, "Email"),
                react_1["default"].createElement("input", { type: "email", id: "email", className: createmanager_module_css_1["default"].input, placeholder: "Enter email", value: formData.email, onChange: handleChange })),
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "password" }, "Password"),
                react_1["default"].createElement("input", { type: showPassword ? 'text' : 'password', id: "password", className: createmanager_module_css_1["default"].input, placeholder: "Enter password", value: formData.password, onChange: handleChange })),
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "district" }, "District"),
                react_1["default"].createElement("input", { type: "text", id: "district", className: createmanager_module_css_1["default"].input, placeholder: "Enter district", value: formData.district, onChange: handleChange })),
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "state" }, "State"),
                react_1["default"].createElement("input", { type: "text", id: "state", className: createmanager_module_css_1["default"].input, placeholder: "Enter state", value: formData.state, onChange: handleChange })),
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].radioGroup },
                react_1["default"].createElement("label", { className: createmanager_module_css_1["default"].radioLabel },
                    react_1["default"].createElement("input", { type: "radio", name: "managerRole", value: "national", checked: formData.category === 'national', onChange: handleRoleChange }),
                    "Make National Manager"),
                react_1["default"].createElement("label", { className: createmanager_module_css_1["default"].radioLabel },
                    react_1["default"].createElement("input", { type: "radio", name: "managerRole", value: "state", checked: formData.category === 'state', onChange: handleRoleChange }),
                    "Make State Manager"),
                react_1["default"].createElement("label", { className: createmanager_module_css_1["default"].radioLabel },
                    react_1["default"].createElement("input", { type: "radio", name: "managerRole", value: "district", checked: formData.category === 'district', onChange: handleRoleChange }),
                    "Make District Manager")),
            react_1["default"].createElement("div", { className: createmanager_module_css_1["default"].checkboxGroup },
                react_1["default"].createElement("label", { className: createmanager_module_css_1["default"].checkboxLabel },
                    react_1["default"].createElement("input", { type: "checkbox", checked: showPassword, onChange: function () { return setShowPassword(!showPassword); } }),
                    "Show Password")),
            react_1["default"].createElement("button", { type: "submit", className: createmanager_module_css_1["default"].submitButton }, "Create"))));
};
exports["default"] = CreateManager;
