"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Data = void 0;
const extension_wrapper_1 = require("../extension_wrapper");
class Data {
    static generate(data) {
        if (data.constructor.name === "Object") {
            return this.mapObject(data);
        }
        else if (Array.isArray(data)) {
            return this.mapArray(data);
        }
        else {
            throw new Error(`Body of type ${data.constructor.name} should be a Object or Array`);
        }
    }
    static toJson(data) {
        return JSON.parse(extension_wrapper_1.datamap.toJson(data));
    }
    static mapObject(hash_value) {
        const map = extension_wrapper_1.datamap.create();
        Object.entries(hash_value).forEach(([key, value]) => {
            switch (typeof value) {
                case "string":
                    extension_wrapper_1.datamap.setString(key, value, map);
                    break;
                case "number":
                    if (Number.isInteger(value)) {
                        extension_wrapper_1.datamap.setInteger(key, value, map);
                    }
                    else {
                        extension_wrapper_1.datamap.setFloat(key, value, map);
                    }
                    break;
                case "bigint":
                    extension_wrapper_1.datamap.setString(key, `bigint:${value}`, map);
                    break;
                case "boolean":
                    extension_wrapper_1.datamap.setBoolean(key, value, map);
                    break;
                case "undefined":
                    extension_wrapper_1.datamap.setString(key, "undefined", map);
                    break;
                case "object":
                    if (!value) {
                        extension_wrapper_1.datamap.setNull(key, map);
                    }
                    else if (Array.isArray(value)) {
                        extension_wrapper_1.datamap.setData(key, this.mapArray(value), map);
                    }
                    else if ((value === null || value === void 0 ? void 0 : value.constructor.name) === "Object") {
                        extension_wrapper_1.datamap.setData(key, this.mapObject(value), map);
                    }
                    else {
                        // attempt to co-erce whatever the data is to a string
                        extension_wrapper_1.datamap.setString(key, String(value), map);
                    }
                    break;
            }
        });
        return map;
    }
    static mapArray(array_value) {
        const array = extension_wrapper_1.dataarray.create();
        array_value.forEach(value => {
            switch (typeof value) {
                case "string":
                    extension_wrapper_1.dataarray.appendString(value, array);
                    break;
                case "number":
                    if (Number.isInteger(value)) {
                        extension_wrapper_1.dataarray.appendInteger(value, array);
                    }
                    else {
                        extension_wrapper_1.dataarray.appendFloat(value, array);
                    }
                    break;
                case "bigint":
                    extension_wrapper_1.dataarray.appendString(`bigint:${value}`, array);
                    break;
                case "boolean":
                    extension_wrapper_1.dataarray.appendBoolean(value, array);
                    break;
                case "undefined":
                    extension_wrapper_1.dataarray.appendString("undefined", array);
                    break;
                case "object":
                    // check null
                    if (!value) {
                        extension_wrapper_1.dataarray.appendNull(array);
                    }
                    else if (Array.isArray(value)) {
                        extension_wrapper_1.dataarray.appendData(this.mapArray(value), array);
                    }
                    else if ((value === null || value === void 0 ? void 0 : value.constructor.name) === "Object") {
                        extension_wrapper_1.dataarray.appendData(this.mapObject(value), array);
                    }
                    else {
                        // attempt to co-erce whatever the data is to a string
                        extension_wrapper_1.dataarray.appendString(String(value), array);
                    }
                    break;
            }
        });
        return array;
    }
}
exports.Data = Data;
