'use strict';
var Util_1 = require("../Util");
var fs = require("fs");
var JSZip = require("jszip");
var http = require("http");
var parse5 = require("parse5");
var myMap = new Map();
var idChecker;
var InsightFacade = (function () {
    function InsightFacade() {
        Util_1.default.trace('InsightFacadeImpl::init()');
    }
    InsightFacade.prototype.addDataset = function (id, content) {
        var that = this;
        return new Promise(function (resolve, reject) {
            var response = {
                code: 0,
                body: {}
            };
            var zip = new JSZip();
            zip.loadAsync(content, { base64: true }).then(function (zip) {
                var promises = [];
                Object.keys(zip.files).forEach(function (filename) {
                    var onePromise = zip.files[filename].async("string").then().catch();
                    promises.push(onePromise);
                });
                Promise.all(promises).then(function (fileData) {
                    var myHashMap = {};
                    if (id === "courses") {
                        fileData.forEach(function (element) {
                            try {
                                var data = JSON.parse(element)["result"];
                                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                                    var entry = data_1[_i];
                                    var myObj_key = entry["id"].toString();
                                    var courses_size = entry["Pass"] + entry["Fail"];
                                    courses_size = courses_size.toString();
                                    if (entry["Section"] === "overall") {
                                        myHashMap[myObj_key] = {
                                            "courses_dept": entry["Subject"],
                                            "courses_id": entry["Course"],
                                            "courses_avg": entry["Avg"],
                                            "courses_instructor": entry["Professor"],
                                            "courses_title": entry["Title"],
                                            "courses_pass": entry["Pass"],
                                            "courses_fail": entry["Fail"],
                                            "courses_audit": entry["Audit"],
                                            "courses_uuid": myObj_key,
                                            "courses_year": 1900,
                                            "courses_size": courses_size
                                        };
                                    }
                                    else {
                                        var year = parseInt(entry["Year"], 10);
                                        myHashMap[myObj_key] = {
                                            "courses_dept": entry["Subject"],
                                            "courses_id": entry["Course"],
                                            "courses_avg": entry["Avg"],
                                            "courses_instructor": entry["Professor"],
                                            "courses_title": entry["Title"],
                                            "courses_pass": entry["Pass"],
                                            "courses_fail": entry["Fail"],
                                            "courses_audit": entry["Audit"],
                                            "courses_uuid": myObj_key,
                                            "courses_year": year,
                                            "courses_size": courses_size
                                        };
                                    }
                                }
                            }
                            catch (err) {
                            }
                        });
                        if (Object.keys(myHashMap).length === 0) {
                            response.code = 400;
                            response.body = { "error": "The input file is empty." };
                            reject(response);
                        }
                        else {
                            var myJSON = JSON.stringify(myHashMap);
                            myMap.set(id, myJSON);
                            fs.writeFile(__dirname + "/../data/" + id, myJSON, { flag: 'wx' }, function (err) {
                                if (err) {
                                    response.code = 201;
                                    response.body = { "message": "Successfully overwritten the file" };
                                }
                                else {
                                    response.code = 204;
                                    response.body = { "message": "Successfully created the file" };
                                }
                                resolve(response);
                            });
                        }
                    }
                    if (id === "rooms") {
                        var tBody = {};
                        var buildings_1 = {};
                        try {
                            var docIndex = parse5.parse(fileData.pop());
                            that.docHelper(tBody, docIndex, "tbody");
                            for (var _i = 0, _a = tBody.childNodes; _i < _a.length; _i++) {
                                var element = _a[_i];
                                if (element.nodeName === "tr") {
                                    var aBuilding = {};
                                    for (var _b = 0, _c = element.childNodes; _b < _c.length; _b++) {
                                        var entry = _c[_b];
                                        if (typeof entry.attrs !== 'undefined') {
                                            if (entry.attrs[0].value === "views-field views-field-field-building-code") {
                                                aBuilding["shortname"] = entry.childNodes[0].value.trim();
                                            }
                                            if (entry.attrs[0].value === "views-field views-field-title") {
                                                aBuilding["fullname"] = entry.childNodes[1].childNodes[0].value;
                                                aBuilding["href"] = entry.childNodes[1].attrs[0].value;
                                            }
                                            if (entry.attrs[0].value === "views-field views-field-field-building-address") {
                                                aBuilding["address"] = entry.childNodes[0].value.trim();
                                            }
                                        }
                                    }
                                    buildings_1[aBuilding["fullname"]] = aBuilding;
                                }
                            }
                        }
                        catch (err) {
                        }
                        var lotsPromises_1 = [];
                        Object.keys(buildings_1).forEach(function (key) {
                            var onePromise = that.getLocations(buildings_1[key]["address"], buildings_1[key]).then().catch();
                            lotsPromises_1.push(onePromise);
                        });
                        Promise.all(lotsPromises_1).then(function () {
                            var roomInfo = [];
                            try {
                                fileData.forEach(function (data) {
                                    var document = parse5.parse(data);
                                    var buffer = {};
                                    that.docHelper(buffer, document, "tbody");
                                    if (Object.keys(buffer).length !== 0) {
                                        roomInfo.push(document);
                                    }
                                });
                                for (var _i = 0, roomInfo_1 = roomInfo; _i < roomInfo_1.length; _i++) {
                                    var entry = roomInfo_1[_i];
                                    var roomInA = {};
                                    var section = {};
                                    that.docHelper(section, entry, "section");
                                    var buildingInfo = {};
                                    that.roomHelper(buildingInfo, section, "building-info");
                                    for (var _a = 0, _b = buildingInfo.childNodes; _a < _b.length; _a++) {
                                        var element = _b[_a];
                                        if (typeof element.attrs !== 'undefined') {
                                            if (element.attrs.length === 0) {
                                                if (element.childNodes[0].childNodes[0].value in buildings_1) {
                                                    var fullname = element.childNodes[0].childNodes[0].value;
                                                    var shortname = buildings_1[fullname]["shortname"];
                                                    var address = buildings_1[fullname]["address"];
                                                    that.docHelper(roomInA, section, "tbody");
                                                    for (var _c = 0, _d = roomInA.childNodes; _c < _d.length; _c++) {
                                                        var element_1 = _d[_c];
                                                        if (element_1.nodeName === "tr") {
                                                            var roomA = {};
                                                            roomA["rooms_fullname"] = fullname;
                                                            roomA["rooms_shortname"] = shortname;
                                                            roomA["rooms_address"] = address;
                                                            roomA["rooms_lat"] = buildings_1[fullname]["lat"];
                                                            roomA["rooms_lon"] = buildings_1[fullname]["lon"];
                                                            for (var _e = 0, _f = element_1.childNodes; _e < _f.length; _e++) {
                                                                var entry_1 = _f[_e];
                                                                if (typeof entry_1.attrs !== 'undefined') {
                                                                    if (entry_1.attrs[0].value === "views-field views-field-field-room-number") {
                                                                        roomA["rooms_href"] = entry_1.childNodes[1].attrs[0].value;
                                                                        roomA["rooms_number"] = entry_1.childNodes[1].childNodes[0].value;
                                                                        roomA["rooms_name"] = shortname + "_" + roomA["rooms_number"];
                                                                    }
                                                                    if (entry_1.attrs[0].value === "views-field views-field-field-room-capacity") {
                                                                        roomA["rooms_seats"] = entry_1.childNodes[0].value.trim();
                                                                        roomA["rooms_seats"] = parseInt(roomA["rooms_seats"], 10);
                                                                    }
                                                                    if (entry_1.attrs[0].value === "views-field views-field-field-room-furniture") {
                                                                        roomA["rooms_furniture"] = entry_1.childNodes[0].value.trim();
                                                                    }
                                                                    if (entry_1.attrs[0].value === "views-field views-field-field-room-type") {
                                                                        roomA["rooms_type"] = entry_1.childNodes[0].value.trim();
                                                                    }
                                                                }
                                                            }
                                                            myHashMap[roomA["rooms_name"]] = roomA;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            catch (err) {
                            }
                            if (Object.keys(myHashMap).length === 0) {
                                response.code = 400;
                                response.body = { "error": "The input file is empty." };
                                reject(response);
                            }
                            else {
                                var myJSON = JSON.stringify(myHashMap);
                                myMap.set(id, myJSON);
                                fs.writeFile(__dirname + "/../data/" + id, myJSON, { flag: 'wx' }, function (err) {
                                    if (err) {
                                        response.code = 201;
                                        response.body = { "message": "Successfully overwritten the file" };
                                    }
                                    else {
                                        response.code = 204;
                                        response.body = { "message": "Successfully created the file" };
                                    }
                                    resolve(response);
                                });
                            }
                        });
                    }
                });
            }).catch(function () {
                response.body = { "error": "Invalid zip file." };
                response.code = 400;
                reject(response);
            });
        });
    };
    InsightFacade.prototype.removeDataset = function (id) {
        return new Promise(function (resolve, reject) {
            fs.unlink(__dirname + "/../data/" + id, function (err) {
                if (err) {
                    var response = {
                        code: 404,
                        body: { "message": "No such file." }
                    };
                    reject(response);
                }
                else {
                    var response = {
                        code: 204,
                        body: { "message": "File is removed." }
                    };
                    myMap.delete(id);
                    resolve(response);
                }
            });
        });
    };
    InsightFacade.prototype.performQuery = function (query) {
        idChecker = "";
        var that = this;
        return new Promise(function (fulfill, reject) {
            var obj;
            var response = {
                code: 0,
                body: {}
            };
            if ((typeof query !== "object") || (query === null) || (Object.keys(query).length > 3)
                || (Object.keys(query).length < 2) || !(query.hasOwnProperty("WHERE")) ||
                !(query.hasOwnProperty("OPTIONS"))) {
                response.code = 400;
                response.body = { "error": "Query format is wrong" };
                reject(response);
            }
            else if ((Object.keys(query).length === 3) && !(query.hasOwnProperty("TRANSFORMATIONS"))) {
                response.code = 400;
                response.body = { "error": "Query format is wrong with three keys" };
                reject(response);
            }
            else if ((Object.keys(query["OPTIONS"]).length < 2) || (Object.keys(query["OPTIONS"]).length > 3)) {
                response.code = 400;
                response.body = { "error": "OPTIONS' keys' length is wrong" };
                reject(response);
            }
            else if ((Object.keys(query["OPTIONS"]).length === 3) && (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))
                || !(query["OPTIONS"].hasOwnProperty("ORDER")) || !(query["OPTIONS"].hasOwnProperty("FORM")))) {
                response.code = 400;
                response.body = { "error": "OPTIONS with order's format is wrong" };
                reject(response);
            }
            else if ((Object.keys(query["OPTIONS"]).length === 2) && (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))
                || !(query["OPTIONS"].hasOwnProperty("FORM")))) {
                response.code = 400;
                response.body = { "error": "OPTIONS without order's format is wrong" };
                reject(response);
            }
            else if ((Object.keys(query).length === 3) && ((Object.keys(query["TRANSFORMATIONS"]).length !== 2) ||
                !(query["TRANSFORMATIONS"].hasOwnProperty("GROUP")) ||
                !(query["TRANSFORMATIONS"].hasOwnProperty("APPLY")))) {
                response.code = 400;
                response.body = { "error": "TRANSFORMATIONS format is wrong" };
                reject(response);
            }
            else {
                var where = query["WHERE"];
                var options = query["OPTIONS"];
                var columns_1 = options["COLUMNS"];
                var order = "";
                var form = options["FORM"];
                var transformations = "";
                var group_1 = "";
                var apply_1 = "";
                var applyKeys_1 = [];
                if (Object.keys(query).length === 3) {
                    transformations = query["TRANSFORMATIONS"];
                    group_1 = transformations["GROUP"];
                    apply_1 = transformations["APPLY"];
                }
                var missingIDs_1 = [];
                if (Object.keys(where).length !== 0) {
                    that.whereCheck(where, missingIDs_1, response);
                }
                if (response.code === 444) {
                    response.code = 400;
                    reject(response);
                }
                if (options.hasOwnProperty("ORDER")) {
                    order = options["ORDER"];
                }
                if (!Array.isArray(columns_1)) {
                    response.code = 400;
                    response.body = { "error": "COLUMNS should be an array, invalid JSON format" };
                    reject(response);
                }
                if (form !== "TABLE") {
                    response.code = 400;
                    response.body = { "error": "Form not valid" };
                    reject(response);
                }
                if (transformations !== "") {
                    if (!Array.isArray(group_1)) {
                        response.code = 400;
                        response.body = { "error": "Group should be an array, invalid JSON format" };
                        reject(response);
                    }
                    else if (!Array.isArray(apply_1)) {
                        response.code = 400;
                        response.body = { "error": "Apply should be an array, invalid JSON format" };
                        reject(response);
                    }
                    else if (group_1.length < 1) {
                        response.code = 400;
                        response.body = { "error": "Group should have at least one member" };
                        reject(response);
                    }
                    else {
                        for (var _i = 0, group_2 = group_1; _i < group_2.length; _i++) {
                            var element = group_2[_i];
                            if (!(InsightFacade.checkInvalidKey(element))) {
                                response.code = 400;
                                response.body = { "error": "Group could not have Apply key" };
                                reject(response);
                            }
                            else if (!(InsightFacade.checkID(element))) {
                                missingIDs_1.push(element.substring(0, element.indexOf("_")));
                            }
                            else if (!(InsightFacade.checkOneKey(element))) {
                                response.code = 400;
                                response.body = { "error": "The query is trying to query two datasets at once" };
                            }
                            else if (!(InsightFacade.checkKeyForOptions(element))) {
                                response.code = 400;
                                response.body = { "error": "Valid ID with content in group" };
                            }
                            else {
                            }
                        }
                        if (apply_1.length > 0) {
                            for (var _a = 0, apply_2 = apply_1; _a < apply_2.length; _a++) {
                                var applyKey = apply_2[_a];
                                if (typeof applyKey !== "object") {
                                    response.code = 400;
                                    response.body = { "error": "ApplyKey should be an object" };
                                    reject(response);
                                }
                                else if (Object.keys(applyKey).length !== 1) {
                                    response.code = 400;
                                    response.body = { "error": "ApplyKey should only have one key-value pair" };
                                    reject(response);
                                }
                                else if (Object.keys(applyKey)[0].indexOf("_") > -1) {
                                    response.code = 400;
                                    response.body = { "error": "Apply keys cannot contain underscore" };
                                    reject(response);
                                }
                                else {
                                    if (applyKeys_1.includes(Object.keys(applyKey)[0])) {
                                        response.code = 400;
                                        response.body = { "error": "Duplicate apply key" };
                                        reject(response);
                                    }
                                    else {
                                        applyKeys_1.push(Object.keys(applyKey)[0]);
                                        var tokenObj = applyKey[Object.keys(applyKey)[0]];
                                        if ((typeof tokenObj !== "object") || (Object.keys(tokenObj).length !== 1)) {
                                            response.code = 400;
                                            response.body = { "error": "The tokenObject is invalid" };
                                            reject(response);
                                        }
                                        else {
                                            var applyToken = Object.keys(tokenObj)[0];
                                            if (!(InsightFacade.checkInvalidKey(tokenObj[applyToken]))) {
                                                response.code = 400;
                                                response.body = { "error": "The token value is invalid" };
                                            }
                                            else if (!(InsightFacade.checkID(tokenObj[applyToken]))) {
                                                missingIDs_1.push(tokenObj[applyToken].substring(0, tokenObj[applyToken].indexOf("_")));
                                            }
                                            else if (!(InsightFacade.checkApply(applyToken, tokenObj[applyToken]))) {
                                                response.code = 400;
                                                response.body = { "error": "The APPLYTOKEN is invalid" };
                                            }
                                            else {
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (order !== "") {
                    if (typeof order === "string") {
                        if (!columns_1.includes(order)) {
                            response.code = 400;
                            response.body = { "error": "Order key needs to be included in columns" };
                            reject(response);
                        }
                    }
                    else if ((typeof order === "object") && (Object.keys(order).length === 2) && (order.hasOwnProperty("dir"))
                        && (order.hasOwnProperty("keys")) && ((order["dir"] === "UP") || (order["dir"] === "DOWN")) &&
                        (Array.isArray(order["keys"]))) {
                        order["keys"].forEach(function (key) {
                            if (!columns_1.includes(key)) {
                                response.code = 400;
                                response.body = { "error": "Order keys should be included in columns" };
                                reject(response);
                            }
                        });
                    }
                    else {
                        response.code = 400;
                        response.body = { "error": "Order's format is wrong" };
                        reject(response);
                    }
                }
                columns_1.forEach(function (key) {
                    if (key.indexOf("_") > -1) {
                        if (group_1 !== "") {
                            if (!group_1.includes(key)) {
                                response.code = 400;
                                response.body = { "error": "All Columns keys should either be in GROUP OR APPLY" };
                            }
                        }
                        else {
                            if (!(InsightFacade.checkID(key))) {
                                missingIDs_1.push(key.substring(0, key.indexOf("_")));
                            }
                            else if (!(InsightFacade.checkOneKey(key))) {
                                response.code = 400;
                                response.body = { "error": "It's trying to query two datasets" };
                            }
                            else if (!(InsightFacade.checkKeyForOptions(key))) {
                                response.code = 400;
                                response.body = { "error": "Invalid column keys" };
                            }
                            else {
                                return;
                            }
                        }
                    }
                    else {
                        if ((apply_1 !== "") && (applyKeys_1.length !== 0)) {
                            if (!applyKeys_1.includes(key)) {
                                response.code = 400;
                                response.body = { "error": "All Columns keys should either be in GROUP OR APPLY" };
                            }
                        }
                        else {
                            response.code = 400;
                            response.body = { "error": "The key in columns/order is not valid" };
                        }
                    }
                });
                if (missingIDs_1.length !== 0) {
                    response.code = 424;
                    response.body = { "missing": missingIDs_1 };
                    reject(response);
                }
                else if (response.code === 400) {
                    reject(response);
                }
                else {
                    var data = void 0;
                    data = myMap.get(idChecker);
                    obj = JSON.parse(data.toString());
                    var result_buffer = {};
                    var result = [];
                    var finalResult = [];
                    if (Object.keys(where).length !== 0) {
                        that.whereHelper(result_buffer, obj, where);
                        InsightFacade.transformationHelper(result, result_buffer, group_1, apply_1, applyKeys_1);
                    }
                    else {
                        InsightFacade.transformationHelper(result, obj, group_1, apply_1, applyKeys_1);
                    }
                    that.resultHelper(result, finalResult, columns_1, order);
                    result = finalResult;
                    response.code = 200;
                    response.body = { "render": "TABLE", result: result };
                    fulfill(response);
                }
            }
        });
    };
    InsightFacade.prototype.whereCheck = function (where, missingIDs, response) {
        var that = this;
        if (where.hasOwnProperty("NOT")) {
            that.whereCheck(where["NOT"], missingIDs, response);
            return;
        }
        else if (where.hasOwnProperty("IS")) {
            var theKeys = Object.keys(where["IS"]);
            if (theKeys.length !== 1) {
                response.code = 400;
                response.body = { "error": "IS should only have one key" };
                return;
            }
            else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                response.code = 400;
                response.body = { "error": "The key in IS is invalid since there is no _ " };
                return;
            }
            else if (!(InsightFacade.checkID(theKeys[0]))) {
                missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                response.code = 424;
                return;
            }
            else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                response.code = 400;
                response.body = { "error": "Query is trying to query two datasets at the same time" };
                return;
            }
            else if (!(InsightFacade.checkKeyForIS(theKeys[0]))) {
                response.code = 400;
                response.body = { "error": "Invalid key in IS" };
                return;
            }
            else if (typeof where["IS"][theKeys[0]] !== "string") {
                response.code = 400;
                response.body = { "error": "IS value should be a string" };
                return;
            }
            else {
                return;
            }
        }
        else if (where.hasOwnProperty("LT") || where.hasOwnProperty("GT") || where.hasOwnProperty("EQ")) {
            if (where.hasOwnProperty("LT")) {
                var theKeys = Object.keys(where["LT"]);
                if (theKeys.length !== 1) {
                    response.code = 400;
                    response.body = { "error": "LT should only have one key" };
                    return;
                }
                else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "The key in LT is invalid since there is no _ " };
                    return;
                }
                else if (!(InsightFacade.checkID(theKeys[0]))) {
                    missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                    response.code = 424;
                    return;
                }
                else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "Query is trying to query two datasets at the same time" };
                    return;
                }
                else if (!(InsightFacade.checkKeyForMath(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "Invalid key in LT" };
                    return;
                }
                else if (typeof where["LT"][theKeys[0]] !== "number") {
                    response.code = 400;
                    response.body = { "error": "LT value should be a number" };
                    return;
                }
                else {
                    return;
                }
            }
            else if (where.hasOwnProperty("GT")) {
                var theKeys = Object.keys(where["GT"]);
                if (theKeys.length !== 1) {
                    response.code = 400;
                    response.body = { "error": "GT should only have one key" };
                    return;
                }
                else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "The key in GT is invalid since there is no _ " };
                    return;
                }
                else if (!(InsightFacade.checkID(theKeys[0]))) {
                    missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                    response.code = 424;
                    return;
                }
                else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "Query is trying to query two datasets at the same time" };
                    return;
                }
                else if (!(InsightFacade.checkKeyForMath(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "Invalid key in GT" };
                    return;
                }
                else if (typeof where["GT"][theKeys[0]] !== "number") {
                    response.code = 400;
                    response.body = { "error": "GT value should be a number" };
                    return;
                }
                else {
                    return;
                }
            }
            else {
                var theKeys = Object.keys(where["EQ"]);
                if (theKeys.length !== 1) {
                    response.code = 400;
                    response.body = { "error": "EQ should only have one key" };
                    return;
                }
                else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "The key in EQ is invalid since there is no _ " };
                    return;
                }
                else if (!(InsightFacade.checkID(theKeys[0]))) {
                    missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                    response.code = 424;
                    return;
                }
                else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "Query is trying to query two datasets at the same time" };
                    return;
                }
                else if (!(InsightFacade.checkKeyForMath(theKeys[0]))) {
                    response.code = 400;
                    response.body = { "error": "Invalid key in EQ" };
                    return;
                }
                else if (typeof where["EQ"][theKeys[0]] !== "number") {
                    response.code = 400;
                    response.body = { "error": "EQ value should be a number" };
                    return;
                }
                else {
                    return;
                }
            }
        }
        else if (where.hasOwnProperty("AND") || where.hasOwnProperty("OR")) {
            if (where.hasOwnProperty("AND")) {
                if (!Array.isArray(where["AND"])) {
                    response.code = 444;
                    response.body = { "error": "AND should be an array, invalid JSON format" };
                    return;
                }
                else if (where["AND"].length < 1) {
                    response.code = 400;
                    response.body = { "error": "The number of keys in AND should be greater than or equal to one" };
                    return;
                }
                else {
                    for (var entry in where["AND"]) {
                        that.whereCheck(where["AND"][entry], missingIDs, response);
                    }
                    return;
                }
            }
            else {
                if (!Array.isArray(where["OR"])) {
                    response.code = 444;
                    response.body = { "error": "OR should be an array, invalid JSON format" };
                    return;
                }
                else if (where["OR"].length < 1) {
                    response.code = 400;
                    response.body = { "error": "The number of keys in OR should be greater than or equal to one" };
                    return;
                }
                else {
                    for (var entry in where["OR"]) {
                        that.whereCheck(where["OR"][entry], missingIDs, response);
                    }
                    return;
                }
            }
        }
        else {
            response.code = 400;
            response.body = { "error": "The WHERE is invalid generally" };
            return;
        }
    };
    InsightFacade.prototype.whereHelper = function (result, obj, where) {
        var that = this;
        if (where.hasOwnProperty("NOT")) {
            var buffer_1 = {};
            that.whereHelper(buffer_1, obj, where["NOT"]);
            Object.keys(obj).forEach(function (key) {
                if (!buffer_1.hasOwnProperty(key)) {
                    if (!result.hasOwnProperty(key)) {
                        result[key] = obj[key];
                    }
                }
            });
            return;
        }
        else if (where.hasOwnProperty('IS')) {
            var iterators_1 = Object.keys(where['IS']);
            Object.keys(obj).forEach(function (data) {
                if (where['IS'][iterators_1[0]].startsWith("*") && where['IS'][iterators_1[0]].endsWith("*")) {
                    var newString0 = where['IS'][iterators_1[0]].substring(1, where['IS'][iterators_1[0]].length - 1);
                    if (obj[data][iterators_1[0]].includes(newString0)) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                    return;
                }
                else if (where['IS'][iterators_1[0]].startsWith("*")) {
                    var newString1 = where['IS'][iterators_1[0]].substring(1);
                    if (obj[data][iterators_1[0]].endsWith(newString1)) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                    return;
                }
                else if (where['IS'][iterators_1[0]].endsWith("*")) {
                    var newString2 = where['IS'][iterators_1[0]].substring(0, where['IS'][iterators_1[0]].length - 1);
                    if (obj[data][iterators_1[0]].startsWith(newString2)) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                    return;
                }
                else {
                    if (obj[data][iterators_1[0]] === where['IS'][iterators_1[0]]) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                        return;
                    }
                }
            });
            return;
        }
        else if (where.hasOwnProperty('LT') || where.hasOwnProperty('GT') || where.hasOwnProperty('EQ')) {
            if (where.hasOwnProperty('LT')) {
                var iterators_2 = Object.keys(where['LT']);
                Object.keys(obj).forEach(function (data) {
                    if (obj[data][iterators_2[0]] < where['LT'][iterators_2[0]]) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                });
                return;
            }
            else if (where.hasOwnProperty('GT')) {
                var iterators_3 = Object.keys(where['GT']);
                Object.keys(obj).forEach(function (data) {
                    if (obj[data][iterators_3[0]] > where['GT'][iterators_3[0]]) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                });
                return;
            }
            else {
                var iterators_4 = Object.keys(where['EQ']);
                Object.keys(obj).forEach(function (data) {
                    if (obj[data][iterators_4[0]] === where['EQ'][iterators_4[0]]) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                });
                return;
            }
        }
        else if (where.hasOwnProperty('AND') || where.hasOwnProperty('OR')) {
            if (where.hasOwnProperty('AND')) {
                for (var entry in where['AND']) {
                    var result0 = {};
                    that.whereHelper(result0, obj, where['AND'][entry]);
                    obj = result0;
                }
                Object.keys(obj).forEach(function (key) {
                    if (!result.hasOwnProperty(key)) {
                        result[key] = obj[key];
                    }
                });
                return;
            }
            else {
                for (var entry in where['OR']) {
                    that.whereHelper(result, obj, where['OR'][entry]);
                }
                return;
            }
        }
        else {
        }
    };
    InsightFacade.prototype.resultHelper = function (result, finalResult, columns, order) {
        result.forEach(function (data) {
            var obj = {};
            for (var _i = 0, columns_2 = columns; _i < columns_2.length; _i++) {
                var entry = columns_2[_i];
                obj[entry] = data[entry];
            }
            finalResult.push(obj);
        });
        if (order !== "") {
            if (typeof order === "string") {
                finalResult.sort(function (a, b) {
                    var num = 0;
                    if (a[order] < b[order]) {
                        num = -1;
                    }
                    if (a[order] > b[order]) {
                        num = 1;
                    }
                    return num;
                });
            }
            if (Object.keys(order).length > 0) {
                var dir = order["dir"];
                var keys_1 = order["keys"];
                if (dir === "UP") {
                    finalResult.sort(function (a, b) {
                        var num = 0;
                        for (var _i = 0, keys_2 = keys_1; _i < keys_2.length; _i++) {
                            var key = keys_2[_i];
                            if (a[key] < b[key]) {
                                num = -1;
                                break;
                            }
                            if (a[key] > b[key]) {
                                num = 1;
                                break;
                            }
                        }
                        return num;
                    });
                }
                if (dir === "DOWN") {
                    finalResult.sort(function (a, b) {
                        var num = 0;
                        for (var _i = 0, keys_3 = keys_1; _i < keys_3.length; _i++) {
                            var key = keys_3[_i];
                            if (a[key] < b[key]) {
                                num = 1;
                                break;
                            }
                            if (a[key] > b[key]) {
                                num = -1;
                                break;
                            }
                        }
                        return num;
                    });
                }
            }
        }
        return;
    };
    InsightFacade.transformationHelper = function (result, result_buffer, group, apply, applyKeys) {
        if (group !== "") {
            if (apply.length !== 0) {
                var applies_1 = {};
                for (var _i = 0, apply_3 = apply; _i < apply_3.length; _i++) {
                    var element = apply_3[_i];
                    applies_1[Object.keys(element)[0]] = element[Object.keys(element)[0]];
                }
                var groupObj_1 = {};
                Object.keys(result_buffer).forEach(function (key) {
                    var newGroupElement = {};
                    for (var _i = 0, group_3 = group; _i < group_3.length; _i++) {
                        var element = group_3[_i];
                        newGroupElement[element] = result_buffer[key][element];
                    }
                    var tempString = JSON.stringify(newGroupElement);
                    if (!groupObj_1.hasOwnProperty(tempString)) {
                        groupObj_1[tempString] = [];
                        groupObj_1[tempString].push(result_buffer[key]);
                    }
                    else {
                        groupObj_1[tempString].push(result_buffer[key]);
                    }
                });
                Object.keys(groupObj_1).forEach(function (element) {
                    var newGroup = JSON.parse(element);
                    for (var _i = 0, applyKeys_2 = applyKeys; _i < applyKeys_2.length; _i++) {
                        var key = applyKeys_2[_i];
                        var applyToken = Object.keys(applies_1[key])[0];
                        var tokenValue = applies_1[key][applyToken];
                        newGroup[key] = InsightFacade.applyHelper(groupObj_1[element], applyToken, tokenValue);
                    }
                    result.push(newGroup);
                });
            }
            else {
                var tempSet_1 = new Set();
                Object.keys(result_buffer).forEach(function (key) {
                    var newGroup = {};
                    for (var _i = 0, group_4 = group; _i < group_4.length; _i++) {
                        var element = group_4[_i];
                        newGroup[element] = result_buffer[key][element];
                    }
                    var tempString = JSON.stringify(newGroup);
                    if (!tempSet_1.has(tempString)) {
                        tempSet_1.add(tempString);
                        result.push(newGroup);
                    }
                });
            }
        }
        else {
            Object.keys(result_buffer).forEach(function (key) {
                result.push(result_buffer[key]);
            });
            return;
        }
    };
    InsightFacade.applyHelper = function (groupBuffer, key, value) {
        if (key === "MAX") {
            var maxResult = "";
            for (var _i = 0, groupBuffer_1 = groupBuffer; _i < groupBuffer_1.length; _i++) {
                var entry = groupBuffer_1[_i];
                if (maxResult === "") {
                    maxResult = entry[value];
                }
                else {
                    if (entry[value] > maxResult) {
                        maxResult = entry[value];
                    }
                }
            }
            return maxResult;
        }
        else if (key === "MIN") {
            var minResult = "";
            for (var _a = 0, groupBuffer_2 = groupBuffer; _a < groupBuffer_2.length; _a++) {
                var entry = groupBuffer_2[_a];
                if (minResult === "") {
                    minResult = entry[value];
                }
                else {
                    if (entry[value] < minResult) {
                        minResult = entry[value];
                    }
                }
            }
            return minResult;
        }
        else if (key === "AVG") {
            var avgResult = 0;
            for (var _b = 0, groupBuffer_3 = groupBuffer; _b < groupBuffer_3.length; _b++) {
                var entry = groupBuffer_3[_b];
                var x = entry[value];
                x = x * 10;
                x = Number(x.toFixed(0));
                avgResult += x;
            }
            avgResult = avgResult / groupBuffer.length;
            avgResult = avgResult / 10;
            return Number(avgResult.toFixed(2));
        }
        else if (key === "COUNT") {
            var countResult = 0;
            var countSet = new Set();
            for (var _c = 0, groupBuffer_4 = groupBuffer; _c < groupBuffer_4.length; _c++) {
                var entry = groupBuffer_4[_c];
                if (!countSet.has(entry[value])) {
                    countSet.add(entry[value]);
                    countResult += 1;
                }
            }
            return countResult;
        }
        else if (key === "SUM") {
            var sumResult = 0;
            for (var _d = 0, groupBuffer_5 = groupBuffer; _d < groupBuffer_5.length; _d++) {
                var entry = groupBuffer_5[_d];
                sumResult = sumResult + entry[value];
            }
            return sumResult;
        }
    };
    InsightFacade.checkApply = function (token, value) {
        var ans = false;
        if (!(InsightFacade.checkApplyToken(token))) {
            return false;
        }
        else {
            switch (token) {
                case "MAX":
                    ans = InsightFacade.checkKeyForMath(value);
                    break;
                case "MIN":
                    ans = InsightFacade.checkKeyForMath(value);
                    break;
                case "AVG":
                    ans = InsightFacade.checkKeyForMath(value);
                    break;
                case "SUM":
                    ans = InsightFacade.checkKeyForMath(value);
                    break;
                case "COUNT":
                    ans = InsightFacade.checkKeyForOptions(value);
                    break;
                default:
                    break;
            }
            return ans;
        }
    };
    InsightFacade.checkApplyToken = function (token) {
        var keys = ['MAX', 'MIN', 'AVG', 'COUNT', 'SUM'];
        return keys.includes(token);
    };
    InsightFacade.checkInvalidKey = function (key) {
        return key.indexOf("_") > -1;
    };
    InsightFacade.checkID = function (key) {
        var ID = key.substring(0, key.indexOf("_"));
        return myMap.has(ID);
    };
    InsightFacade.checkOneKey = function (key) {
        if (idChecker === "") {
            idChecker = key.substring(0, key.indexOf("_"));
            return true;
        }
        else {
            return idChecker === key.substring(0, key.indexOf("_"));
        }
    };
    InsightFacade.checkKeyForOptions = function (key) {
        if (idChecker === "courses") {
            var keys = ["courses_dept", "courses_id", "courses_avg", "courses_instructor", "courses_title",
                "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year", "courses_size"];
            return keys.includes(key);
        }
        else if (idChecker === "rooms") {
            var keys = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_lat", "rooms_lon", "rooms_seats", "rooms_type", "rooms_furniture", "rooms_href"];
            return keys.includes(key);
        }
        else {
            return false;
        }
    };
    InsightFacade.checkKeyForIS = function (key) {
        if (idChecker === "courses") {
            var keys = ["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid",
                "courses_size"];
            return keys.includes(key);
        }
        else if (idChecker === "rooms") {
            var keys = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_type", "rooms_furniture", "rooms_href"];
            return keys.includes(key);
        }
        else {
            return false;
        }
    };
    InsightFacade.checkKeyForMath = function (key) {
        if (idChecker === "courses") {
            var keys = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"];
            return keys.includes(key);
        }
        else if (idChecker === "rooms") {
            var keys = ["rooms_lat", "rooms_lon", "rooms_seats"];
            return keys.includes(key);
        }
        else {
            return false;
        }
    };
    InsightFacade.prototype.docHelper = function (tBody, docIndex, aName) {
        var that = this;
        if (docIndex.nodeName === aName) {
            Object.assign(tBody, docIndex);
            return;
        }
        else {
            for (var _i = 0, _a = docIndex.childNodes; _i < _a.length; _i++) {
                var element = _a[_i];
                if (typeof element.childNodes !== 'undefined') {
                    that.docHelper(tBody, element, aName);
                }
            }
            return;
        }
    };
    ;
    InsightFacade.prototype.roomHelper = function (buildingInfo, docRoom, aName) {
        var that = this;
        if (typeof docRoom.attrs !== 'undefined') {
            for (var _i = 0, _a = docRoom.attrs; _i < _a.length; _i++) {
                var element = _a[_i];
                if (typeof element !== 'undefined') {
                    if (element.value === aName) {
                        Object.assign(buildingInfo, docRoom);
                        return;
                    }
                    else {
                        for (var _b = 0, _c = docRoom.childNodes; _b < _c.length; _b++) {
                            var element_2 = _c[_b];
                            if (typeof element_2.attrs !== 'undefined') {
                                that.roomHelper(buildingInfo, element_2, aName);
                            }
                        }
                    }
                }
            }
        }
        return;
    };
    InsightFacade.prototype.getLocations = function (rooms_address, building) {
        return new Promise(function (resolve, reject) {
            var roomURL = encodeURIComponent(rooms_address);
            http.get("http://skaha.cs.ubc.ca:11316/api/v1/team34/" + roomURL, function (res) {
                var statusCode = res.statusCode;
                var contentType = res.headers['content-type'];
                var error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        ("Status Code: " + statusCode));
                }
                else if (!/^application\/json/.test(contentType)) {
                    error = new Error("Invalid content-type.\n" +
                        ("Expected application/json but received " + contentType));
                }
                if (error) {
                    console.log(error.message);
                    res.resume();
                    return;
                }
                res.setEncoding('utf8');
                var rawData = '';
                res.on('data', function (chunk) { return rawData += chunk; });
                res.on('end', function () {
                    try {
                        var parsedData = JSON.parse(rawData);
                        building["lat"] = parsedData.lat;
                        building["lon"] = parsedData.lon;
                        resolve(parsedData);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            }).on('error', function (e) {
                console.log("Got error: " + e.message);
            });
        });
    };
    return InsightFacade;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map