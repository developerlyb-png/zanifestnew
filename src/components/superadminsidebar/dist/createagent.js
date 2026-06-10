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
var createagent_module_css_1 = require("@/styles/components/superadminsidebar/createagent.module.css");
var axios_1 = require("axios");
var CreateAgent = function () {
    var _a = react_1.useState({
        name: '',
        email: '',
        district: '',
        city: '',
        state: '',
        password: '',
        assignedTo: ''
    }), formData = _a[0], setFormData = _a[1];
    var _b = react_1.useState(false), showPassword = _b[0], setShowPassword = _b[1];
    var _c = react_1.useState([]), districtManagers = _c[0], setDistrictManagers = _c[1];
    // Fetch district managers
    react_1.useEffect(function () {
        var fetchManagers = function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1["default"].get('/api/managers/agentDistrictDropdown')];
                    case 1:
                        res = _a.sent();
                        setDistrictManagers(res.data.managers);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchManagers();
    }, []);
    var handleChange = function (e) {
        var _a;
        setFormData(__assign(__assign({}, formData), (_a = {}, _a[e.target.id] = e.target.value, _a)));
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].post('/api/createagent', formData)];
                case 2:
                    _a.sent();
                    console.log('Agent created successfully:', formData);
                    alert('Agent created successfully!');
                    // Clear form fields
                    setFormData({
                        name: '',
                        email: '',
                        district: '',
                        city: '',
                        state: '',
                        password: '',
                        assignedTo: ''
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.error(err_2);
                    alert('Failed to create agent');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fields = ['name', 'email', 'district', 'city', 'state'];
    return (react_1["default"].createElement("div", { className: createagent_module_css_1["default"].container },
        react_1["default"].createElement("h2", { className: createagent_module_css_1["default"].heading }, "Create Agent"),
        react_1["default"].createElement("form", { className: createagent_module_css_1["default"].form, onSubmit: handleSubmit },
            fields.map(function (field) { return (react_1["default"].createElement("div", { className: createagent_module_css_1["default"].formGroup, key: field },
                react_1["default"].createElement("label", { htmlFor: field }, field.charAt(0).toUpperCase() + field.slice(1)),
                react_1["default"].createElement("input", { type: "text", id: field, className: createagent_module_css_1["default"].input, placeholder: "Enter " + field, value: formData[field], onChange: handleChange }))); }),
            react_1["default"].createElement("div", { className: createagent_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "password" }, "Password"),
                react_1["default"].createElement("input", { type: showPassword ? 'text' : 'password', id: "password", className: createagent_module_css_1["default"].input, placeholder: "Enter password", value: formData.password, onChange: handleChange })),
            react_1["default"].createElement("div", { className: createagent_module_css_1["default"].checkboxGroup },
                react_1["default"].createElement("label", { className: createagent_module_css_1["default"].checkboxLabel },
                    react_1["default"].createElement("input", { type: "checkbox", checked: showPassword, onChange: function () { return setShowPassword(!showPassword); } }),
                    "Show Password")),
            react_1["default"].createElement("div", { className: createagent_module_css_1["default"].formGroup },
                react_1["default"].createElement("label", { htmlFor: "assignedTo" }, "Assign to District Manager (ID)"),
                react_1["default"].createElement("select", { id: "assignedTo", value: formData.assignedTo, onChange: handleChange, className: createagent_module_css_1["default"].input },
                    react_1["default"].createElement("option", { value: "" }, "Select Manager"),
                    districtManagers.map(function (manager) { return (react_1["default"].createElement("option", { key: manager.id, value: manager.id },
                        manager.name,
                        " (ID: ",
                        manager.id,
                        ")")); }))),
            react_1["default"].createElement("button", { type: "submit", className: createagent_module_css_1["default"].submitButton }, "Create"))));
};
exports["default"] = CreateAgent;
// import React, { useState } from 'react';
// import styles from '@/styles/components/superadminsidebar/createagent.module.css';
// const CreateAgent = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   return (
//     <div className={styles.container}>
//       <h2 className={styles.heading}>Create Agent</h2>
//       <form className={styles.form}>
//         <div className={styles.formGroup}>
//           <label htmlFor="fullName">Full Name</label>
//           <input type="text" id="fullName" className={styles.input} placeholder="Enter full name" />
//         </div>
//         <div className={styles.formGroup}>
//           <label htmlFor="email">Email</label>
//           <input type="email" id="email" className={styles.input} placeholder="Enter email" />
//         </div>
//         <div className={styles.formGroup}>
//           <label htmlFor="district">District</label>
//           <input type="text" id="district" className={styles.input} placeholder="Enter district" />
//         </div>
//         <div className={styles.formGroup}>
//           <label htmlFor="city">City</label>
//           <input type="text" id="city" className={styles.input} placeholder="Enter city" />
//         </div>
//         <div className={styles.formGroup}>
//           <label htmlFor="state">State</label>
//           <input type="text" id="state" className={styles.input} placeholder="Enter state" />
//         </div>
//         <div className={styles.formGroup}>
//           <label htmlFor="password">Password</label>
//           <input
//             type={showPassword ? 'text' : 'password'}
//             id="password"
//             className={styles.input}
//             placeholder="Enter password"
//           />
//         </div>
//         <div className={styles.checkboxGroup}>
//           <label className={styles.checkboxLabel}>
//             <input
//               type="checkbox"
//               checked={showPassword}
//               onChange={() => setShowPassword(!showPassword)}
//             />
//             Show Password
//           </label>
//         </div>
//         <button type="submit" className={styles.submitButton}>Create</button>
//       </form>
//     </div>
//   );
// };
// export default CreateAgent;
