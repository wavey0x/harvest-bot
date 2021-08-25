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
exports.getReportsForStrategy = void 0;
var lodash_1 = require("lodash");
var subgraph_1 = require("./subgraph");
var buildReportsQuery = function (strategy) { return "\n{\n    strategies(where: {\n      id: \"" + strategy + "\"\n    }) {\n        id\n        reports(first: 10, orderBy: timestamp, orderDirection: desc)  {\n          id\n          transaction {\n            hash\n          }\n          timestamp\n          gain\n          loss\n          totalGain\n          totalLoss\n          totalDebt\n          debtLimit\n          debtAdded\n          debtPaid\n          results {\n            startTimestamp\n            endTimestamp\n            duration\n            apr\n            durationPr\n            currentReport {\n                id\n                gain\n                loss\n                totalDebt\n                totalGain\n                totalLoss\n                timestamp\n                transaction { hash blockNumber }\n            }\n            previousReport {\n                id\n                gain\n                loss\n                totalDebt\n                totalGain\n                totalLoss\n                timestamp\n                transaction { hash blockNumber }\n            }\n          }\n        }\n      }\n  }\n"; };
var _getReportsForStrategy = function (strategy) { return __awaiter(void 0, void 0, void 0, function () {
    var reportResults, reports, OMIT_FIELDS, values;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!strategy || strategy === '') {
                    throw new Error('Error: getReportsForStrategy expected valid strategy address');
                }
                return [4 /*yield*/, subgraph_1.querySubgraphData(buildReportsQuery(strategy.toLowerCase()))];
            case 1:
                reportResults = _a.sent();
                reports = lodash_1.get(reportResults, 'data.strategies[0].reports', []);
                OMIT_FIELDS = ['results', 'transaction', 'id'];
                values = reports.map(function (report) {
                    var results;
                    if (report.results.length > 0) {
                        var result = report.results[0];
                        results = __assign(__assign({}, result), { currentReport: __assign(__assign({}, result.currentReport), { timestamp: result.currentReport.timestamp }), previousReport: __assign(__assign({}, result.previousReport), { timestamp: result.previousReport.timestamp }), startTimestamp: parseInt(result.startTimestamp), endTimestamp: parseInt(result.endTimestamp), duration: parseInt(result.duration), durationPr: parseFloat(result.durationPr), apr: parseFloat(result.apr) * 100 });
                    }
                    return __assign(__assign({}, lodash_1.omit(report, OMIT_FIELDS)), { profit: report.gain, loss: report.loss, totalProfit: report.totalGain, transactionHash: report.transaction.hash, results: results });
                });
                return [2 /*return*/, values];
        }
    });
}); };
exports.getReportsForStrategy = lodash_1.memoize(_getReportsForStrategy);
