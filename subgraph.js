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
exports.querySubgraphData = exports.BuildGetExperimental = exports.BuildGet = exports.spread = exports.put = exports.post = exports.all = exports.get = void 0;
var axios_1 = require("axios");
var lodash_1 = require("lodash");
exports.get = axios_1["default"].get, exports.all = axios_1["default"].all, exports.post = axios_1["default"].post, exports.put = axios_1["default"].put, exports.spread = axios_1["default"].spread;
var LEGACY_API_URL = 'https://vaults.finance';
var API_URL = 'https://api.yearn.finance/v1/chains/1';
var SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet';
var filterToExperimentals = function (res) {
    var response = { data: [] };
    response.data =
        res &&
            res.data;
    return response;
};
var getData = function (url, useExperimentals) {
    if (useExperimentals === void 0) { useExperimentals = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var payload, apiUrl, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = { data: [] };
                    apiUrl = useExperimentals ? LEGACY_API_URL : API_URL;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].get("" + apiUrl + url)];
                case 2:
                    response = _a.sent();
                    if (!useExperimentals) {
                        return [2 /*return*/, response];
                    }
                    return [2 /*return*/, filterToExperimentals(response)];
                case 3:
                    error_1 = _a.sent();
                    console.log('error fetching data', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, payload];
            }
        });
    });
};
exports.BuildGet = lodash_1.memoize(getData);
exports.BuildGetExperimental = lodash_1.memoize(function (url) {
    return getData(url, true);
});
/*
config: {url: "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet", method: "post", data: "{"query":"\n{\n\tvaults {\n    id\n    tags\n    t…it\n        debtAdded\n      }\n    }\n  }\n}\n"}", headers: {…}, transformRequest: Array(1), …}
data: {data: {…}}
headers: {content-type: "application/json"}
request: XMLHttpRequest {readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, onreadystatechange: ƒ, …}
status: 200
statusText: ""
*/
var querySubgraph = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1["default"].post("" + SUBGRAPH_URL, {
                        query: query
                    })];
            case 1:
                response = _a.sent();
                if (response.data.errors && response.data.errors.length > 0) {
                    throw Error(response.data.errors[0].message ||
                        'Error: retrieving data from subgraph');
                }
                return [2 /*return*/, {
                        data: response.data.data
                    }];
            case 2:
                error_2 = _a.sent();
                console.error('subgraph error', error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.querySubgraphData = lodash_1.memoize(querySubgraph);
