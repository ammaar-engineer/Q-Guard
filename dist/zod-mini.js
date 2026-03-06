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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Q_GuardEngine = void 0;
exports.sg = sg;
exports.ds = ds;
function sg(data, securtyVariaty, queue) {
    var QUEUE_KEY = Object.keys(queue || {});
    var queue_task = [];
    var queue_task_key = [];
    QUEUE_KEY.forEach(function (key) {
        var selectedFunc = securtyVariaty[key];
        queue_task_key.push(key);
        queue_task.push(selectedFunc);
    });
    var isSuccess = true;
    var issue = [];
    queue_task.forEach(function (func, i) {
        var curr_queue_key = queue_task_key[i];
        var _a = queue[curr_queue_key], expectedValue = _a.expectedValue, errmsg = _a.errmsg;
        try {
            var execute = func(data, expectedValue);
            if (!execute)
                throw Error();
        }
        catch (_b) {
            isSuccess = false;
            issue.push({
                errmsg: errmsg,
                loc: curr_queue_key
            });
        }
    });
    return isSuccess ? { isSuccess: isSuccess, data: data } : { isSuccess: isSuccess, issue: issue };
}
function ds(expectedValue, errmsg) {
    return { expectedValue: expectedValue, errmsg: errmsg };
}
var Q_GuardEngine = /** @class */ (function () {
    function Q_GuardEngine(securityMiddleware, transformerMiddleware) {
        var _this = this;
        this.oz = function (obj, setup_arr) {
            var securityList = _this.securityMiddleware;
            var transformerList = _this.transformerMiddleware;
            // All keys
            var expected_obj_setup = setup_arr[0], transformer_obj_setup = setup_arr[1];
            var TRANSFORMER_OBJ_KEY = Object.keys(transformer_obj_setup || {});
            var EXPECTED_OBJ_KEY = Object.keys(expected_obj_setup);
            var isSuccess = true;
            var issue = [];
            var currData = {};
            // Checking key first
            for (var _i = 0, EXPECTED_OBJ_KEY_1 = EXPECTED_OBJ_KEY; _i < EXPECTED_OBJ_KEY_1.length; _i++) {
                var key_ex = EXPECTED_OBJ_KEY_1[_i];
                if (!obj[key_ex]) {
                    isSuccess = false;
                    issue.push({
                        loc: key_ex,
                        errmsg: "Obj ".concat(key_ex, " not found"),
                        layer: 'security_check'
                    });
                    break;
                }
                // Go through security layer
                var expectedValue_key = Object.keys(expected_obj_setup[key_ex]);
                for (var _a = 0, expectedValue_key_1 = expectedValue_key; _a < expectedValue_key_1.length; _a++) {
                    var list_check_key = expectedValue_key_1[_a];
                    // console.log(`Security layer => ${list_check_key}`)
                    var target_func = securityList[list_check_key];
                    var _b = expected_obj_setup[key_ex][list_check_key], expectedValue = _b.expectedValue, errmsg = _b.errmsg;
                    var execute = target_func(obj[key_ex], expectedValue);
                    if (!execute) {
                        isSuccess = false;
                        issue.push({
                            loc: key_ex,
                            onCheck: list_check_key,
                            errmsg: errmsg,
                            layer: 'security_check'
                        });
                        break;
                    }
                }
            }
            if (TRANSFORMER_OBJ_KEY.length != 0 && isSuccess) {
                for (var _c = 0, TRANSFORMER_OBJ_KEY_1 = TRANSFORMER_OBJ_KEY; _c < TRANSFORMER_OBJ_KEY_1.length; _c++) {
                    var key_tf = TRANSFORMER_OBJ_KEY_1[_c];
                    if (!obj[key_tf]) {
                        isSuccess = false;
                        issue.push({
                            loc: key_tf,
                            errmsg: "Obj ".concat(key_tf, " Not found"),
                            layer: 'transform_layer'
                        });
                        break;
                    }
                    var transformerValue = Object.keys(transformer_obj_setup[key_tf]);
                    for (var _d = 0, transformerValue_1 = transformerValue; _d < transformerValue_1.length; _d++) {
                        var tf_list_key = transformerValue_1[_d];
                        var tf_into = transformer_obj_setup[key_tf][tf_list_key];
                        var choosedFunc = transformerList[tf_list_key];
                        var dataForFunc = currData[key_tf] ? currData[key_tf] : obj[key_tf];
                        var data = choosedFunc(tf_into, dataForFunc);
                        // console.log(`Transformer Layer => ${tf_list_key}`)
                        currData[key_tf] = data;
                    }
                }
            }
            return isSuccess ? { isSuccess: isSuccess, data: TRANSFORMER_OBJ_KEY.length != 0 ? __assign(__assign({}, obj), currData) : obj } : { isSuccess: isSuccess, issue: issue };
        };
        this.securityMiddleware = securityMiddleware;
        this.transformerMiddleware = transformerMiddleware;
    }
    return Q_GuardEngine;
}());
exports.Q_GuardEngine = Q_GuardEngine;
