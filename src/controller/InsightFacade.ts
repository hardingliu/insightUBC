/**
 * This is the main programmatic entry point for the project.
 */

'use strict';

import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import Log from "../Util";

import fs = require("fs");
import JSZip = require("jszip");
import http = require("http");
const parse5 = require("parse5");

interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

let myMap = new Map();
let idChecker: string;

export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {

        let that = this;

        return new Promise(function (resolve, reject) {

            let response = <InsightResponse> {
                code: 0,
                body: {}
            };

            let zip = new JSZip();

            zip.loadAsync(content, {base64: true}).then(function (zip: any) {

                let promises: any = [];

                Object.keys(zip.files).forEach(function (filename) {
                    let onePromise = zip.files[filename].async("string").then().catch();
                    promises.push(onePromise);
                });

                Promise.all(promises).then(function (fileData: any) {

                    let myHashMap: any = {};
                    if (id === "courses") {
                        fileData.forEach(function (element: any) {
                            try {
                                let data = JSON.parse(element)["result"];
                                for (let entry of data) {
                                    let myObj_key: string = entry["id"].toString();
                                    let courses_size: any = entry["Pass"] + entry["Fail"];
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
                                    } else {
                                        let year: number = parseInt(entry["Year"], 10);
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
                            } catch (err) {

                            }
                        });

                        if (Object.keys(myHashMap).length === 0) {
                            response.code = 400;
                            response.body = {"error": "The input file is empty."};
                            reject(response);
                        }

                        else {
                            let myJSON = JSON.stringify(myHashMap, null, '  ');
                            myMap.set(id, myJSON);
                            fs.writeFile(__dirname + "/../../data/" + id + ".json", myJSON, {flag: 'wx'}, function (err) {
                                if (err) {
                                    response.code = 201;
                                    response.body = {"message": "Successfully overwritten the file"};
                                } else {
                                    response.code = 204;
                                    response.body = {"message": "Successfully created the file"};
                                }
                                resolve(response);
                            });
                        }

                    }

                    if (id === "rooms") {
                        let tBody :any = {};
                        let buildings: any = {};

                        try {
                            let docIndex: any = parse5.parse(fileData.pop());
                            that.docHelper(tBody, docIndex, "tbody");
                            for (let element of tBody.childNodes) {
                                if (element.nodeName === "tr") {
                                    let aBuilding: any = {};
                                    for (let entry of element.childNodes) {
                                        if (typeof entry.attrs !== 'undefined') {
                                            if (entry.attrs[0].value === "views-field views-field-field-building-code")
                                            {
                                                aBuilding["shortname"] = entry.childNodes[0].value.trim();
                                            }
                                            if (entry.attrs[0].value === "views-field views-field-title") {
                                                aBuilding["fullname"] = entry.childNodes[1].childNodes[0].value;
                                                aBuilding["href"] = entry.childNodes[1].attrs[0].value;
                                            }
                                            if (entry.attrs[0].value === "views-field views-field-field-building-address")
                                            {
                                                aBuilding["address"] = entry.childNodes[0].value.trim();
                                            }
                                        }
                                    }
                                    buildings[aBuilding["fullname"]] = aBuilding;
                                }
                            }
                        } catch (err) {

                        }


                        let lotsPromises: Array<any> = [];
                        Object.keys(buildings).forEach(function (key: any) {
                            let onePromise = that.getLocations(buildings[key]["address"], buildings[key]).then().catch();
                            lotsPromises.push(onePromise);
                        });

                        Promise.all(lotsPromises).then(function () {

                            let roomInfo: Array<any> = [];
                            try {
                                fileData.forEach(function (data: any) {
                                    let document: any = parse5.parse(data);
                                    let buffer: any = {};
                                    that.docHelper(buffer, document, "tbody");
                                    if (Object.keys(buffer).length !== 0) {
                                        roomInfo.push(document);
                                    }
                                });


                                for (let entry of roomInfo) {
                                    let roomInA: any = {};
                                    let section: any = {};
                                    that.docHelper(section, entry, "section");
                                    let buildingInfo: any = {};
                                    that.roomHelper(buildingInfo, section, "building-info");
                                    for (let element of buildingInfo.childNodes) {
                                        if (typeof element.attrs !== 'undefined') {
                                            if (element.attrs.length === 0) {
                                                if (element.childNodes[0].childNodes[0].value in buildings) {
                                                    let fullname: string = element.childNodes[0].childNodes[0].value;
                                                    let shortname: string = buildings[fullname]["shortname"];
                                                    let address: string = buildings[fullname]["address"];
                                                    that.docHelper(roomInA, section, "tbody");
                                                    for (let element of roomInA.childNodes) {
                                                        if (element.nodeName === "tr") {
                                                            let roomA: any = {};
                                                            roomA["rooms_fullname"] = fullname;
                                                            roomA["rooms_shortname"] = shortname;
                                                            roomA["rooms_address"] = address;
                                                            roomA["rooms_lat"] = buildings[fullname]["lat"];
                                                            roomA["rooms_lon"] = buildings[fullname]["lon"];
                                                            for (let entry of element.childNodes) {
                                                                if (typeof entry.attrs !== 'undefined') {
                                                                    if (entry.attrs[0].value === "views-field views-field-field-room-number") {
                                                                        roomA["rooms_href"] = entry.childNodes[1].attrs[0].value;
                                                                        roomA["rooms_number"] = entry.childNodes[1].childNodes[0].value;
                                                                        roomA["rooms_name"] = shortname + "_" + roomA["rooms_number"];
                                                                    }
                                                                    if (entry.attrs[0].value === "views-field views-field-field-room-capacity") {
                                                                        roomA["rooms_seats"] = entry.childNodes[0].value.trim();
                                                                        roomA["rooms_seats"] = parseInt(roomA["rooms_seats"], 10);
                                                                    }
                                                                    if (entry.attrs[0].value === "views-field views-field-field-room-furniture") {
                                                                        roomA["rooms_furniture"] = entry.childNodes[0].value.trim();
                                                                    }
                                                                    if (entry.attrs[0].value === "views-field views-field-field-room-type") {
                                                                        roomA["rooms_type"] = entry.childNodes[0].value.trim();
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
                            } catch (err) {

                            }

                            if (Object.keys(myHashMap).length === 0) {
                                response.code = 400;
                                response.body = {"error": "The input file is empty."};
                                reject(response);
                            }

                            else {
                                let myJSON = JSON.stringify(myHashMap, null, '  ');
                                myMap.set(id, myJSON);
                                fs.writeFile(__dirname + "/../../data/" + id + ".json", myJSON, {flag: 'wx'}, function (err) {
                                    if (err) {
                                        response.code = 201;
                                        response.body = {"message": "Successfully overwritten the file"};
                                    } else {
                                        response.code = 204;
                                        response.body = {"message": "Successfully created the file"};
                                    }
                                    resolve(response);
                                });
                            }
                        });
                    }

                });

            }).catch(function () {
                response.body = {"error": "Invalid zip file."};
                response.code = 400;
                reject(response);
            });
        });
    }

    removeDataset(id: string): Promise<InsightResponse> {

        return new Promise(function (resolve, reject) {
            fs.unlink(__dirname + "/../../data/" + id + ".json", function (err) {
                if (err) {
                    let response = <InsightResponse> {
                        code: 404,
                        body: {"message": "No such file."}
                    };
                    reject(response);
                } else {
                    let response = <InsightResponse> {
                        code: 204,
                        body: {"message": "File is removed."}
                    };
                    myMap.delete(id);
                    resolve(response);
                }
            });
        });
    }


    performQuery(query: QueryRequest): Promise <InsightResponse> {

        idChecker = "";

        let that = this;
        return new Promise(function (fulfill, reject) {
            let obj: any;

            let response = <InsightResponse> {
                code: 0,
                body: {}
            };

            if ((typeof query !== "object") || (query === null) || (Object.keys(query).length > 3)
                || (Object.keys(query).length < 2) || !(query.hasOwnProperty("WHERE")) ||
                !(query.hasOwnProperty("OPTIONS")))
            {
                response.code = 400;
                response.body = {"error": "Query format is wrong"};
                reject(response);
            }

            else if ((Object.keys(query).length === 3) && !(query.hasOwnProperty("TRANSFORMATIONS"))) {
                response.code = 400;
                response.body = {"error": "Query format is wrong with three keys"};
                reject(response);
            }

            else if ((Object.keys(query["OPTIONS"]).length < 2) || (Object.keys(query["OPTIONS"]).length > 3)) {
                response.code = 400;
                response.body = {"error": "OPTIONS' keys' length is wrong"};
                reject(response);
            }

            else if ((Object.keys(query["OPTIONS"]).length === 3) && (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))
                || !(query["OPTIONS"].hasOwnProperty("ORDER")) || !(query["OPTIONS"].hasOwnProperty("FORM")))) {
                response.code = 400;
                response.body = {"error": "OPTIONS with order's format is wrong"};
                reject(response);
            }

            else if ((Object.keys(query["OPTIONS"]).length === 2) && (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))
                || !(query["OPTIONS"].hasOwnProperty("FORM")))) {
                response.code = 400;
                response.body = {"error": "OPTIONS without order's format is wrong"};
                reject(response);
            }

            else if ((Object.keys(query).length === 3) && ((Object.keys(query["TRANSFORMATIONS"]).length !== 2) ||
                !(query["TRANSFORMATIONS"].hasOwnProperty("GROUP")) ||
                !(query["TRANSFORMATIONS"].hasOwnProperty("APPLY")))) {

                response.code = 400;
                response.body = {"error": "TRANSFORMATIONS format is wrong"};
                reject(response);
            }

            else {
                let where: any = query["WHERE"];
                let options: any = query["OPTIONS"];
                let columns: any = options["COLUMNS"];
                let order: any = "";
                let form: any = options["FORM"];

                let transformations: any = "";
                let group: any = "";
                let apply: any = "";
                let applyKeys: Array<string> = [];

                if (Object.keys(query).length === 3) {
                    transformations = query["TRANSFORMATIONS"];
                    group = transformations["GROUP"];
                    apply = transformations["APPLY"];
                }

                let missingIDs: Array<any> = [];

                if (Object.keys(where).length !== 0) {
                    that.whereCheck(where, missingIDs, response);
                }

                if (response.code === 444) {
                    response.code = 400;
                    reject(response);
                }

                if (options.hasOwnProperty("ORDER")) {
                    order = options["ORDER"];
                }


                if (!Array.isArray(columns)) {
                    response.code = 400;
                    response.body = {"error": "COLUMNS should be an array, invalid JSON format"};
                    reject(response);
                }

                if (form !== "TABLE") {
                    response.code = 400;
                    response.body = {"error": "Form not valid"};
                    reject(response);
                }


                if (transformations !== "") {
                    if (!Array.isArray(group)) {
                        response.code = 400;
                        response.body = {"error": "Group should be an array, invalid JSON format"};
                        reject(response);
                    }
                    else if (!Array.isArray(apply)) {
                        response.code = 400;
                        response.body = {"error": "Apply should be an array, invalid JSON format"};
                        reject(response);
                    }
                    else if (group.length < 1) {
                        response.code = 400;
                        response.body = {"error": "Group should have at least one member"};
                        reject(response);
                    }
                    else {
                        for (let element of group) {
                            if(!(InsightFacade.checkInvalidKey(element))) {
                                response.code = 400;
                                response.body = {"error": "Group could not have Apply key"};
                                reject(response);
                            }

                            else if (!(InsightFacade.checkID(element))) {
                                missingIDs.push(element.substring(0, element.indexOf("_")));
                            }

                            else if (!(InsightFacade.checkOneKey(element))) {
                                response.code = 400;
                                response.body = {"error": "The query is trying to query two datasets at once"};
                            }

                            else if (!(InsightFacade.checkKeyForOptions(element))) {
                                response.code = 400;
                                response.body = {"error": "Valid ID with content in group"};
                            }
                            else {

                            }
                        }

                        if (apply.length > 0) {
                            for (let applyKey of apply) {
                                if (typeof applyKey !== "object") {
                                    response.code = 400;
                                    response.body = {"error": "ApplyKey should be an object"};
                                    reject(response);
                                } else if (Object.keys(applyKey).length !== 1) {
                                    response.code = 400;
                                    response.body = {"error": "ApplyKey should only have one key-value pair"};
                                    reject(response);
                                } else if (Object.keys(applyKey)[0].indexOf("_") > -1) {
                                    response.code = 400;
                                    response.body = {"error": "Apply keys cannot contain underscore"};
                                    reject(response);
                                } else {
                                    if (applyKeys.includes(Object.keys(applyKey)[0])) {
                                        response.code = 400;
                                        response.body = {"error": "Duplicate apply key"};
                                        reject(response);
                                    } else {
                                        applyKeys.push(Object.keys(applyKey)[0]);
                                        let tokenObj: any = applyKey[Object.keys(applyKey)[0]];
                                        if ((typeof tokenObj !== "object") || (Object.keys(tokenObj).length !== 1)) {
                                            response.code = 400;
                                            response.body = {"error": "The tokenObject is invalid"};
                                            reject(response);
                                        } else {
                                            let applyToken: string = Object.keys(tokenObj)[0];
                                            if (!(InsightFacade.checkInvalidKey(tokenObj[applyToken]))) {
                                                response.code = 400;
                                                response.body = {"error": "The token value is invalid"};
                                            }
                                            else if (!(InsightFacade.checkID(tokenObj[applyToken]))) {
                                                missingIDs.push(tokenObj[applyToken].substring(0, tokenObj[applyToken].indexOf("_")));
                                            }

                                            else if (!(InsightFacade.checkApply(applyToken, tokenObj[applyToken]))) {
                                                response.code = 400;
                                                response.body = {"error": "The APPLYTOKEN is invalid"};
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
                        if (!columns.includes(order)) {
                            response.code = 400;
                            response.body = {"error": "Order key needs to be included in columns"};
                            reject(response);
                        }
                    }

                    else if ((typeof order === "object") && (Object.keys(order).length === 2) && (order.hasOwnProperty("dir"))
                        && (order.hasOwnProperty("keys")) && ((order["dir"] === "UP") || (order["dir"] === "DOWN")) &&
                        (Array.isArray(order["keys"]))) {

                        order["keys"].forEach(function (key: any) {
                            if (!columns.includes(key)) {
                                response.code = 400;
                                response.body = {"error": "Order keys should be included in columns"};
                                reject(response);
                            }
                        });
                    }

                    else {
                        response.code = 400;
                        response.body = {"error": "Order's format is wrong"};
                        reject(response);
                    }
                }


                columns.forEach(function (key: any) {

                    if (key.indexOf("_") > -1) {

                        if (group !== "") {
                            if (!group.includes(key)) {
                                response.code = 400;
                                response.body = {"error": "All Columns keys should either be in GROUP OR APPLY"};
                            }
                        } else {
                            if (!(InsightFacade.checkID(key))) {
                                missingIDs.push(key.substring(0, key.indexOf("_")));
                            }

                            else if (!(InsightFacade.checkOneKey(key))) {
                                response.code = 400;
                                response.body = {"error": "It's trying to query two datasets"};
                            }

                            else if (!(InsightFacade.checkKeyForOptions(key))) {
                                response.code = 400;
                                response.body = {"error": "Invalid column keys"};
                            }

                            else {
                                return;
                            }
                        }

                    }

                    else {

                        if ((apply !== "") && (applyKeys.length !== 0)) {

                            if (!applyKeys.includes(key)) {
                                response.code = 400;
                                response.body = {"error": "All Columns keys should either be in GROUP OR APPLY"};
                            }
                        }

                        else {
                            response.code = 400;
                            response.body = {"error": "The key in columns/order is not valid"};
                        }
                    }
                });

                if (missingIDs.length !== 0) {
                    response.code = 424;
                    response.body = {"missing": missingIDs};
                    reject(response);
                }

                else if (response.code === 400) {
                    reject(response);
                }

                else {
                    let data: any;
                    data = myMap.get(idChecker);
                    obj = JSON.parse(data.toString());
                    let result_buffer: any = {};
                    let result: Array<any> = [];
                    let finalResult: Array<any> = [];
                    if (Object.keys(where).length !== 0) {
                        that.whereHelper(result_buffer, obj, where);
                        InsightFacade.transformationHelper(result, result_buffer, group, apply, applyKeys);
                    } else {
                        InsightFacade.transformationHelper(result, obj, group, apply, applyKeys);
                    }
                    that.resultHelper(result, finalResult, columns, order);
                    // Since the name of the result should be "result"
                    result = finalResult;
                    response.code = 200;
                    response.body = {"render": "TABLE", result};
                    fulfill(response);
                }
            }
        });
    }


    public whereCheck(where: any, missingIDs: Array<any>, response: any): any {
        let that = this;
        if (where.hasOwnProperty("NOT")) {
            that.whereCheck(where["NOT"], missingIDs, response);
            return;
        }

        else if (where.hasOwnProperty("IS")) {
            let theKeys = Object.keys(where["IS"]);
            if (theKeys.length !== 1) {
                response.code = 400;
                response.body = {"error": "IS should only have one key"};
                return;
            } else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                response.code = 400;
                response.body = {"error": "The key in IS is invalid since there is no _ "};
                return;
            } else if (!(InsightFacade.checkID(theKeys[0]))) {
                missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                response.code = 424;
                return;
            } else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                response.code = 400;
                response.body = {"error": "Query is trying to query two datasets at the same time"};
                return;
            } else if (!(InsightFacade.checkKeyForIS(theKeys[0]))) {
                response.code = 400;
                response.body = {"error": "Invalid key in IS"};
                return;
            } else if (typeof where["IS"][theKeys[0]] !== "string") {
                response.code = 400;
                response.body = {"error": "IS value should be a string"};
                return;
            } else {
                return;
            }
        }

        else if (where.hasOwnProperty("LT") || where.hasOwnProperty("GT") || where.hasOwnProperty("EQ")) {

            if (where.hasOwnProperty("LT")) {
                let theKeys = Object.keys(where["LT"]);
                if (theKeys.length !== 1) {
                    response.code = 400;
                    response.body = {"error": "LT should only have one key"};
                    return;
                } else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "The key in LT is invalid since there is no _ "};
                    return;
                } else if (!(InsightFacade.checkID(theKeys[0]))) {
                    missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                    response.code = 424;
                    return;
                } else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "Query is trying to query two datasets at the same time"};
                    return;
                } else if (!(InsightFacade.checkKeyForMath(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "Invalid key in LT"};
                    return;
                } else if (typeof where["LT"][theKeys[0]] !== "number") {
                    response.code = 400;
                    response.body = {"error": "LT value should be a number"};
                    return;
                } else {
                    return;
                }
            }

            else if (where.hasOwnProperty("GT")) {
                let theKeys = Object.keys(where["GT"]);
                if (theKeys.length !== 1) {
                    response.code = 400;
                    response.body = {"error": "GT should only have one key"};
                    return;
                } else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "The key in GT is invalid since there is no _ "};
                    return;
                } else if (!(InsightFacade.checkID(theKeys[0]))) {
                    missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                    response.code = 424;
                    return;
                } else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "Query is trying to query two datasets at the same time"};
                    return;
                } else if (!(InsightFacade.checkKeyForMath(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "Invalid key in GT"};
                    return;
                } else if (typeof where["GT"][theKeys[0]] !== "number") {
                    response.code = 400;
                    response.body = {"error": "GT value should be a number"};
                    return;
                } else {
                    return;
                }
            }

            else {
                let theKeys = Object.keys(where["EQ"]);
                if (theKeys.length !== 1) {
                    response.code = 400;
                    response.body = {"error": "EQ should only have one key"};
                    return;
                } else if (!(InsightFacade.checkInvalidKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "The key in EQ is invalid since there is no _ "};
                    return;
                } else if (!(InsightFacade.checkID(theKeys[0]))) {
                    missingIDs.push(theKeys[0].substring(0, theKeys[0].indexOf("_")));
                    response.code = 424;
                    return;
                } else if (!(InsightFacade.checkOneKey(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "Query is trying to query two datasets at the same time"};
                    return;
                } else if (!(InsightFacade.checkKeyForMath(theKeys[0]))) {
                    response.code = 400;
                    response.body = {"error": "Invalid key in EQ"};
                    return;
                } else if (typeof where["EQ"][theKeys[0]] !== "number") {
                    response.code = 400;
                    response.body = {"error": "EQ value should be a number"};
                    return;
                } else {
                    return;
                }
            }
        }

        else if (where.hasOwnProperty("AND") || where.hasOwnProperty("OR")) {
            if (where.hasOwnProperty("AND")) {
                if (!Array.isArray(where["AND"])) {
                    response.code = 444;
                    response.body = {"error": "AND should be an array, invalid JSON format"};
                    return;
                }
                else if (where["AND"].length < 1) {
                    response.code = 400;
                    response.body = {"error": "The number of keys in AND should be greater than or equal to one"};
                    return;
                } else {
                    for (let entry in where["AND"]) {
                        that.whereCheck(where["AND"][entry], missingIDs, response);
                    }
                    return;
                }
            } else {
                if (!Array.isArray(where["OR"])) {
                    response.code = 444;
                    response.body = {"error": "OR should be an array, invalid JSON format"};
                    return;
                }
                else if (where["OR"].length < 1) {
                    response.code = 400;
                    response.body = {"error": "The number of keys in OR should be greater than or equal to one"};
                    return;
                } else {
                    for (let entry in where["OR"]) {
                        that.whereCheck(where["OR"][entry], missingIDs, response);
                    }
                    return;
                }
            }
        }

        else {
            response.code = 400;
            response.body = {"error": "The WHERE is invalid generally"};
            return
        }
    }


    public whereHelper(result: any, obj: any, where: any): any {

        let that = this;

        if (where.hasOwnProperty("NOT")) {
            let buffer: any = {};

            that.whereHelper(buffer, obj, where["NOT"]);

            Object.keys(obj).forEach(function (key: any) {
                if (!buffer.hasOwnProperty(key)) {
                    if (!result.hasOwnProperty(key)) {
                        result[key] = obj[key];
                    }
                }
            });

            return;
        }

        else if (where.hasOwnProperty('IS')) {

            let iterators = Object.keys(where['IS']);

            Object.keys(obj).forEach(function (data: any) {

                if (where['IS'][iterators[0]].startsWith("*") && where['IS'][iterators[0]].endsWith("*")) {

                    let newString0: string = where['IS'][iterators[0]].substring(1, where['IS'][iterators[0]].length - 1);

                    if (obj[data][iterators[0]].includes(newString0)) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                    return;

                } else if (where['IS'][iterators[0]].startsWith("*")) {
                    let newString1: string = where['IS'][iterators[0]].substring(1);

                    if (obj[data][iterators[0]].endsWith(newString1)) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }

                    return;

                }

                else if (where['IS'][iterators[0]].endsWith("*")) {
                    let newString2: string = where['IS'][iterators[0]].substring(0, where['IS'][iterators[0]].length - 1);

                    if (obj[data][iterators[0]].startsWith(newString2)) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }

                    return;
                }

                else {

                    if (obj[data][iterators[0]] === where['IS'][iterators[0]]) {
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
                let iterators = Object.keys(where['LT']);
                Object.keys(obj).forEach(function (data: any) {
                    if (obj[data][iterators[0]] < where['LT'][iterators[0]]) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                });
                return;

            }

            else if (where.hasOwnProperty('GT')) {
                let iterators = Object.keys(where['GT']);
                Object.keys(obj).forEach(function (data: any) {
                    if (obj[data][iterators[0]] > where['GT'][iterators[0]]) {
                        if (!result.hasOwnProperty(data)) {
                            result[data] = obj[data];
                        }
                    }
                });
                return;

            }

            else {
                let iterators = Object.keys(where['EQ']);
                Object.keys(obj).forEach(function (data: any) {
                    if (obj[data][iterators[0]] === where['EQ'][iterators[0]]) {
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

                for (let entry in where['AND']) {
                    let result0: any = {};
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

                for (let entry in where['OR']) {
                    that.whereHelper(result, obj, where['OR'][entry]);
                }
                return;

            }
        }

        else {
        }
    }

    public resultHelper(result: Array<any>, finalResult: Array<any>, columns: any, order: any): any {
        result.forEach(function (data) {
            let obj: any = {};
            for (let entry of columns) {
                obj[entry] = data[entry];
            }
            finalResult.push(obj);
        });

        if (order !== "") {
            if (typeof order === "string") {
                finalResult.sort(function (a, b) {
                    let num: number = 0;
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
                let dir: string = order["dir"];
                let keys: Array<string> = order["keys"];
                if (dir === "UP") {
                    finalResult.sort(function (a, b) {
                        let num: number = 0;
                        for (let key of keys) {
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
                        let num: number = 0;
                        for (let key of keys) {
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
    }

    static transformationHelper(result: Array<any>, result_buffer: any, group: any, apply: any, applyKeys: any): any {
        if (group !== "") {

            if (apply.length !== 0) {
                let applies: any = {};
                for (let element of apply) {
                    applies[Object.keys(element)[0]] = element[Object.keys(element)[0]];
                }
                let groupObj: any = {};
                Object.keys(result_buffer).forEach(function (key) {
                    let newGroupElement: any = {};
                    for (let element of group) {
                        newGroupElement[element] = result_buffer[key][element];
                    }
                    let tempString: string = JSON.stringify(newGroupElement);
                    if (!groupObj.hasOwnProperty(tempString)) {
                        groupObj[tempString] = [];
                        groupObj[tempString].push(result_buffer[key]);
                    } else {
                        groupObj[tempString].push(result_buffer[key]);
                    }
                });

                Object.keys(groupObj).forEach(function (element) {
                    let newGroup: any = JSON.parse(element);
                    for (let key of applyKeys) {
                        let applyToken: any = Object.keys(applies[key])[0];
                        let tokenValue: any = applies[key][applyToken];
                        newGroup[key] = InsightFacade.applyHelper(groupObj[element], applyToken, tokenValue);
                    }
                    result.push(newGroup);
                });

            } else {

                let tempSet: any = new Set();
                Object.keys(result_buffer).forEach(function (key) {
                    let newGroup: any = {};
                    for (let element of group) {
                        newGroup[element] = result_buffer[key][element];
                    }
                    let tempString: string = JSON.stringify(newGroup);
                    if (!tempSet.has(tempString)) {
                        tempSet.add(tempString);
                        result.push(newGroup);
                    }
                });

            }
        }

        else {
            Object.keys(result_buffer).forEach(function (key: any) {
                result.push(result_buffer[key]);
            });
            return;
        }
    }


    static applyHelper(groupBuffer: any, key: any, value: any): any {
        if (key === "MAX") {
            let maxResult: any = "";
            for (let entry of groupBuffer) {
                if (maxResult === "") {
                    maxResult = entry[value];
                } else {
                    if (entry[value] > maxResult) {
                        maxResult = entry[value];
                    }
                }
            }
            return maxResult;

        } else if (key === "MIN") {
            let minResult: any = "";
            for (let entry of groupBuffer) {
                if (minResult === "") {
                    minResult = entry[value];
                } else {
                    if (entry[value] < minResult) {
                        minResult = entry[value];
                    }
                }
            }
            return minResult;

        } else if (key === "AVG") {
            let avgResult: number = 0;
            for (let entry of groupBuffer) {
                let x: number = entry[value];
                x = x * 10;
                x = Number(x.toFixed(0));
                avgResult += x;
            }
            avgResult =  avgResult / groupBuffer.length;
            avgResult =  avgResult / 10;

            return Number(avgResult.toFixed(2));
        }

        else if (key === "COUNT") {
            let countResult: number = 0;
            let countSet: any = new Set();
            for (let entry of groupBuffer) {
                if (!countSet.has(entry[value])) {
                    countSet.add(entry[value]);
                    countResult += 1;
                }
            }
            return countResult;

        } else if (key === "SUM") {
            let sumResult: number = 0;
            for (let entry of groupBuffer) {
                sumResult = sumResult + entry[value];
            }
            return sumResult;

        }
    }


    static checkApply(token: string, value: string): boolean {
        let ans: boolean = false;
        if (!(InsightFacade.checkApplyToken(token))) {
            return false;
        } else {
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
    }

    static checkApplyToken(token: string): boolean {
        let keys: Array<string> = ['MAX', 'MIN', 'AVG', 'COUNT', 'SUM'];
        return keys.includes(token);
    }

    static checkInvalidKey(key: string): boolean {
        return key.indexOf("_") > -1;
    }

    static checkID(key: string): boolean {
        let ID: string = key.substring(0, key.indexOf("_"));
        return myMap.has(ID);
    }

    static checkOneKey(key: string): boolean {
        if (idChecker === "") {
            idChecker = key.substring(0, key.indexOf("_"));
            return true;
        } else {
            return idChecker === key.substring(0, key.indexOf("_"));
        }
    }

    static checkKeyForOptions(key: string): boolean {
        if (idChecker === "courses") {
            let keys: Array<string> = ["courses_dept", "courses_id", "courses_avg", "courses_instructor", "courses_title",
                "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year", "courses_size"];
            return keys.includes(key);
        }

        else if (idChecker === "rooms") {
            let keys: Array<string> = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_lat", "rooms_lon", "rooms_seats", "rooms_type", "rooms_furniture", "rooms_href"];
            return keys.includes(key);
        }

        else {
            return false;
        }
    }

    static checkKeyForIS(key: string): boolean {
        if (idChecker === "courses") {
            let keys: Array<string> = ["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid"
                , "courses_size"];
            return keys.includes(key);
        }

        else if (idChecker === "rooms") {
            let keys: Array<string> = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_type", "rooms_furniture", "rooms_href"];
            return keys.includes(key);
        }

        else {
            return false;
        }
    }

    static checkKeyForMath(key: string): boolean {
        if (idChecker === "courses") {
            let keys: Array<string> = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"];
            return keys.includes(key);
        }

        else if (idChecker === "rooms") {
            let keys: Array<string> = ["rooms_lat", "rooms_lon", "rooms_seats"];
            return keys.includes(key);
        }

        else {
            return false;
        }
    }



    private docHelper(tBody: any, docIndex: any, aName: string): any {
        let that = this;
        if (docIndex.nodeName === aName) {
            Object.assign(tBody, docIndex);
            return;
        } else {
            for (let element of docIndex.childNodes) {
                if (typeof element.childNodes !== 'undefined') {
                    that.docHelper(tBody, element, aName);
                }
            }

            return;
        }
    };


    private roomHelper(buildingInfo: any, docRoom: any, aName: string): any {

        let that = this;
        if (typeof docRoom.attrs !== 'undefined') {
            for (let element of docRoom.attrs) {
                if (typeof element !== 'undefined') {
                    if (element.value === aName) {
                        Object.assign(buildingInfo, docRoom);
                        return;
                    } else {
                        for (let element of docRoom.childNodes) {
                            if (typeof element.attrs !== 'undefined') {
                                that.roomHelper(buildingInfo, element, aName);
                            }
                        }
                    }
                }
            }
        }
        return;
    }


    private getLocations(rooms_address: string, building: any): Promise<GeoResponse> {
        return new Promise(function (resolve, reject) {
            let roomURL: string = encodeURIComponent(rooms_address);
            http.get("http://skaha.cs.ubc.ca:11316/api/v1/team34/" + roomURL, (res) => {
                const statusCode = res.statusCode;
                const contentType = res.headers['content-type'];

                let error: any;
                if (statusCode !== 200) {
                    error = new Error(`Request Failed.\n` +
                        `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error(`Invalid content-type.\n` +
                        `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    console.log(error.message);
                    // consume response data to free up memory
                    res.resume();
                    return;
                }

                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => rawData += chunk);
                res.on('end', () => {
                    try {
                        let parsedData = JSON.parse(rawData);
                        building["lat"] = parsedData.lat;
                        building["lon"] = parsedData.lon;
                        resolve(parsedData);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', (e) => {
                console.log(`Got error: ${e.message}`);
            });
        });
    }
}
