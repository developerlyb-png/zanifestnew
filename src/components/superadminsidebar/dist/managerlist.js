'use client';
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
function ManagersTable() {
    var _this = this;
    var _a = react_1.useState([]), managers = _a[0], setManagers = _a[1];
    var _b = react_1.useState(true), loading = _b[0], setLoading = _b[1];
    react_1.useEffect(function () {
        var fetchManagers = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/getmanager')];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        setManagers(data);
                        setLoading(false);
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error('Error fetching managers:', err_1);
                        setLoading(false);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchManagers();
    }, []);
    if (loading)
        return react_1["default"].createElement("p", { className: "text-center" }, "Loading managers...");
    return (react_1["default"].createElement("div", { className: "p-4 overflow-x-auto" },
        react_1["default"].createElement("h2", { className: "text-xl font-bold mb-4" }, "All Managers"),
        react_1["default"].createElement("table", { className: "w-full border border-gray-300" },
            react_1["default"].createElement("thead", { className: "bg-gray-100" },
                react_1["default"].createElement("tr", null,
                    react_1["default"].createElement("th", { className: "p-2 border" }, "ID"),
                    react_1["default"].createElement("th", { className: "p-2 border" }, "Name"),
                    react_1["default"].createElement("th", { className: "p-2 border" }, "Email"),
                    react_1["default"].createElement("th", { className: "p-2 border" }, "Category"),
                    react_1["default"].createElement("th", { className: "p-2 border" }, "State"),
                    react_1["default"].createElement("th", { className: "p-2 border" }, "District"),
                    react_1["default"].createElement("th", { className: "p-2 border" }, "Assigned To"))),
            react_1["default"].createElement("tbody", null, managers.map(function (manager, index) {
                var _a, _b;
                return (react_1["default"].createElement("tr", { key: manager._id, className: "text-center" },
                    react_1["default"].createElement("td", { className: "p-2 border" }, index + 1),
                    " ",
                    react_1["default"].createElement("td", { className: "p-2 border" }, manager.name),
                    react_1["default"].createElement("td", { className: "p-2 border" }, manager.email),
                    react_1["default"].createElement("td", { className: "p-2 border" }, manager.category),
                    react_1["default"].createElement("td", { className: "p-2 border" }, (_a = manager.location) === null || _a === void 0 ? void 0 : _a.state),
                    react_1["default"].createElement("td", { className: "p-2 border" }, (_b = manager.location) === null || _b === void 0 ? void 0 : _b.district),
                    react_1["default"].createElement("td", { className: "p-2 border" }, manager.assignedTo
                        ? manager.assignedTo.name + " (" + manager.assignedTo.category + ")"
                        : '—')));
            })))));
}
exports["default"] = ManagersTable;
