/**
 * Created by harding on 2017-01-30.
 */
import {expect} from "chai";
import InsightFacade from "../src/model/InsightFacade";
import {InsightResponse} from "../src/model/IInsightFacade";
import fs = require("fs");

describe("InsightFacadeSpec", function () {
    this.timeout(10000);

    let insightFacade: InsightFacade = null;

    let content: string = "";
    let contentEmpty: string = "";
    let contentRooms: string = "";

    fs.readFile(__dirname + "/courses.zip", {encoding: "base64"}, function (err: any, data: any) {
        if (err) {
            throw err;
        } else {
            content = data;
        }
    });

    fs.readFile(__dirname + "/empty.zip", {encoding: "base64"}, function (err: any, data: any) {
        if (err) {
            throw err;
        } else {
            contentEmpty = data;
        }
    });

    fs.readFile(__dirname + "/rooms.zip", {encoding: "base64"}, function (err: any, data: any) {
        if (err) {
            throw err;
        } else {
            contentRooms = data;
        }
    });


    beforeEach(function () {
        insightFacade = new InsightFacade();
    });

    afterEach(function () {
        insightFacade = null;
    });

    it('Test for an empty courses.', function () {
        return insightFacade.addDataset("courses", contentEmpty).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('Test for an empty rooms.', function () {
        return insightFacade.addDataset("rooms", contentEmpty).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it('Test for adding the rooms file when there was no file', function () {
        return insightFacade.addDataset("rooms", contentRooms).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Test for adding a file when there was no file.', function () {
        return insightFacade.addDataset("courses", content).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Test for overwriting a courses file.', function () {
        return insightFacade.addDataset("courses", content).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Vanadium0', function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {
                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs",
                            "sumAudits",
                            "minAvg",
                            "sumFail"
                        ],
                        "ORDER": {
                            "dir": "DOWN",
                            "keys":[
                                "courses_dept",
                                "courses_id",
                                "countProfs",
                                "sumAudits",
                                "minAvg",
                                "sumFail"
                            ]
                        } ,
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id", "courses_instructor"],
                        "APPLY": [
                            {"maxPass": { "MAX": "courses_pass"}},
                            {"minAvg":{"MIN":"courses_avg"}},
                            {"sumAudits": {"SUM": "courses_audit"}},
                            {"countProfs": {"COUNT": "courses_instructor"}},
                            {"sumFail": {"SUM": "courses_fail"}}
                            ]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                 expect.fail();
            });
        });

    it('Titanium'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {
                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "courses_uuid"

                        ],
                        "ORDER": {
                            "dir": "DOWN",
                            "keys": ["courses_uuid"]
                        },
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": [ "courses_dept",
                            "courses_id",
                            "courses_uuid"],
                        "APPLY": []
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });


    it('Tomacoo', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {
                            "GT": {"courses_avg": 500000000}
                        }
                    ]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_id"
                    ],
                    "ORDER": "courses_id",
                    "FORM": "TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Test for overwriting a rooms file.', function () {
        return insightFacade.addDataset("rooms", contentRooms).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Test for removing a file.', function () {
        return insightFacade.removeDataset("courses").then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('Test for query on a file when there is no file.', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "NOT": {
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });


    it('Test for query on rooms 1.', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "IS": {
                        "rooms_name": "DMP_*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_name"
                    ],
                    "ORDER": "rooms_name",
                    "FORM": "TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Test for query on rooms 2.', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "IS": {
                        "rooms_address": "*Agrono*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_address", "rooms_name"
                    ],
                    "ORDER": "rooms_name",
                    "FORM": "TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('2.6', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "NOT": {
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "HA":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('Test for an valid key with invalid value', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "IS": {
                        "rooms_lat": "DMP_*"
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_lat"
                    ],
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it('2.7', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "NOT": {
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "FOR":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it('3', function () {
        return insightFacade.removeDataset("courses").then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404);
        });
    });

    it('4', function () {
        return insightFacade.addDataset("invalidJSON", "asdfasdfa").then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('5', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "GT": {
                        "courses_avg": 97
                    }
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it('6', function () {
        return insightFacade.addDataset("courses", content).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Test for d3 1'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {},
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept", "courses_year", "courses_id", "courses_avg", "courses_instructor",
                            "courses_title", "minGrade"
                        ],
                        "ORDER": "courses_dept",
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_year", "courses_id", "courses_avg", "courses_instructor", "courses_title"],
                        "APPLY": [
                            {
                                "minGrade": {
                                    "MIN": "courses_avg"
                                }
                            }
                        ]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Test for d3 2'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {
                        "AND": [{
                            "IS": {
                                "rooms_furniture": "*Tables*"
                            }
                        }, {
                            "GT": {
                                "rooms_seats": 300
                            }
                        }]
                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "rooms_shortname",
                            "maxSeats",
                            "minSeats"
                        ],
                        "ORDER": {
                            "dir": "DOWN",
                            "keys": ["maxSeats"]
                        },
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["rooms_shortname"],
                        "APPLY": [
                            {
                                "maxSeats": {
                                    "MAX": "rooms_seats"
                                }
                            },
                            {
                                "minSeats": {
                                    "MIN": "rooms_seats"
                                }
                            }
                        ]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Test for querying on two dataset with IS', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "AND": [{
                        "IS": {
                            "rooms_address": "*Agrono*"
                        }

                    }, {
                        "IS": {
                            "courses_instructor": "*Agrono*"
                        }
                    }]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_lat"
                    ],
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('Test for querying on two dataset with LT', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "AND": [{
                        "GT": {
                            "rooms_seats": 90
                        }

                    }, {
                        "LT": {
                            "courses_avg": 90
                        }
                    }, {
                        "EQ": {
                            "courses_year": 1900
                        }
                    }, {
                        "GT": {
                            "courses_pass": 10
                        }
                    }]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_lat"
                    ],
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('Test for query on two IDs.', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "IS": {
                        "rooms_name": "DMP_*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_name"
                    ],
                    "ORDER": "courses_name",
                    "FORM": "TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('7*', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [{
                        "IS": {
                            "rooms_furniture": "*Tables*"
                        }
                    }, {
                        "GT": {
                            "rooms_seats": 300
                        }
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_shortname",
                        "maxSeats"
                    ],
                    "ORDER": {
                        "dir": "DOWN",
                        "keys": ["maxSeats"]
                    },
                    "FORM": "TABLE"
                },
                "TRANSFORMATIONS": {
                    "GROUP": ["rooms_shortname"],
                    "APPLY": [
                        {
                            "maxSeats": {
                                "MAX": "rooms_seats"
                            }
                        }
                    ]
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });



    it('7', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[
                        {
                            "AND":[
                                {
                                    "GT":{
                                        "courses_avg":90
                                    }
                                },
                                {
                                    "IS":{
                                        "courses_dept":"adhe"
                                    }
                                }
                            ]
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('7.1', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[
                        {
                            "AND":[
                                {
                                    "GT":{
                                        "courses_avg":90
                                    }
                                },
                                {
                                    "IS":{
                                        "courses_dept":"adhe"
                                    }
                                }
                            ]
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_id",
                        "courses_avg",
                        "courses_instructor",
                        "courses_title",
                        "courses_pass",
                        "courses_fail",
                        "courses_audit",
                        "courses_uuid",
                    ],
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('7.2', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[

                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('7.3', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[
                        {
                            "AND":[
                                {
                                    "GT":{
                                        "courses_avg":90
                                    }
                                },
                                {
                                    "IS":{
                                        "courses_dept":"adhe"
                                    }
                                }
                            ]
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS": {
                        "courses_dept": "ha",
                        "courses_id": "ha",
                        "courses_avg": "ha"
                    },
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('8', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "courses_avg":97
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: columns', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_name",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order0', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_fullname",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order1', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_shortname",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order2', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_number",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order3', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_name",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order4', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_address",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order5', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_lat",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order6', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_lon",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order7', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_seats",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order8', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_type",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order9', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_furniture",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('rooms options: order10', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "rooms_seats":20
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href"
                    ],
                    "ORDER":"rooms_href",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('9', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "courses_avg":93
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_year"
                    ],
                    "ORDER":"courses_year",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('10', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "AND":[
                        {
                            "GT":{
                                "courses_avg":95
                            }
                        },
                        {
                            "IS":{
                                "courses_dept":"math"
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('11', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "GT": {
                            "courses_avg": 97
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('12', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "EQ":{
                        "courses_avg":97
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_title",
                        "courses_pass",
                        "courses_fail",
                        "courses_audit",
                        "courses_dept"
                    ],
                    "ORDER":"courses_dept",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('13', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "GT": {
                        "courses_avg": 98
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_id"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('14', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 60
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_title"
                    ],
                    "ORDER":"courses_title",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('16', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 97
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER":"courses_fail",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('17', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 97
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_audit"
                    ],
                    "ORDER":"courses_audit",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('18', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 97
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_uuid"
                    ],
                    "ORDER":"courses_uuid",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('19', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "courses_avg":97
                    }
                },
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {

            expect(response.code).to.equal(400);
        });
    });

    it('20', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "AND":[
                        {
                            "GT":{
                                "courses_avg":95
                            }
                        },
                        {
                            "IS":{
                                "courses_dept":"math"
                            }
                        },
                        {
                            "GT": {
                                "courses_avg":20
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('21', function () {
        return insightFacade.performQuery(
            {
                "WHERE":{
                    "AND":[
                        {
                            "NOT": {
                                "GT":{
                                    "courses_avg": 95
                                }
                            }
                        },
                        {
                            "IS":{
                                "courses_dept":"math"
                            }
                        },
                        {
                            "GT": {
                                "courses_avg":20
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('21.5', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[
                        {
                            "GT":{
                                "courses_avg":95
                            }
                        },
                        {
                            "IS":{
                                "courses_dept":"math"
                            }
                        },
                        {
                            "GT": {
                                "courses_avg":20
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('22', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {},
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_furniture"
                    ],
                    "ORDER": "rooms_furniture",
                    "FORM": "TABLE"
                },
                "TRANSFORMATIONS": {
                    "GROUP": ["rooms_furniture"],
                    "APPLY": []
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('23', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 97
                    }
                },
                "OPTIONS":{
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('24', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "AND": []
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('24.5', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR": []
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('24.55', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "NOT": {"OR": []}
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('24.56', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "NOT": {"AND": []}
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_instructor",
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });




    it('25', function () {
        return insightFacade.performQuery(
            {
                "WHERE": {
                    "NOT": {
                        "NOT": {
                            "GT": {
                                "courses_avg": 97
                            }
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('26', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('27', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "NOT": {
                            "LT": {
                                "courses_avg": 97
                            }
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('28', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "NOT": {
                            "EQ": {
                                "courses_avg": 97
                            }
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('29', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "NOT": {
                            "OR": [
                                {"IS": {"courses_dept": "math"}},
                                {"GT": {"courses_avg": 98}},
                                {"EQ": {"courses_avg": 50}}
                            ]
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('30', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "AND": [
                            {"IS": {"courses_instructor": "friedman"}}
                        ]
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('31', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "OR": [
                            {"IS": {"courses_instructor": "friedman"}}
                        ]
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('32', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "LT": {
                        "courses_avg": 30
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_id"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('33', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "NOT": {
                            "OR": [
                                {"IS": {"courses_dept": "math"}},
                                {"GT": {"courses_avg": 98}}
                            ]
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });



    it('34', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "LT": {
                        "courses_avg": 50
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_id"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('35', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "LT": {
                        "courses_avg": 30,
                        "courses_pass": 50
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('36', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "GT": {
                        "courses_avg": 30,
                        "courses_pass": 50
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('37', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 30,
                        "courses_pass": 50
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('38', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "IS": {
                        "courses_avg": 30,
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('39', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {"courses_instructor": "friedman",
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('40', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "LT": {"courses_instructor": "friedman",
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('41', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "GT": {"courses_instructor": "friedman",
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('42', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "EQ": {"courses_instructor": "friedman",
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('43', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "IS": {
                        "courses_avg": 30,
                        "courses_dept": "math"
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('44', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_avg": 30,
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('45', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "LT": {
                        "courses_avg": 70
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER":"courses_id",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('46', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "IS": {
                        "courses_instructor": "john"
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('47', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_instructor": "john"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('48', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "GT": {
                        "courses_audit": 10
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('49', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {
                            "GT": {
                                "courses_avg": 70
                            }},
                        {
                            "LT": {"courses_avg": 80}
                        }

                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('50', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "OR": [
                        {
                            "IS": {
                                "courses_dept": "math"
                            }},
                        {
                            "IS": {"courses_dept": "cpsc"}
                        }

                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('51', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {
                            "IS": {
                                "courses_dept": "math"
                            }
                        },
                        {
                            "OR": [ {
                                "IS": { "courses_instructor": "loewen, philip;paton, kelly"
                                }},
                                {"IS": {"courses_instructor": "*liu*"}}
                            ]
                        }

                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('52', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {
                            "IS": {
                                "courses_dept": "math"
                            }
                        },
                        {
                            "OR": [ {
                                "IS": { "courses_instructor": "loewen, philip;paton, kelly"
                                }},
                                {"IS": {"courses_instructor": "*liu"}}
                            ]
                        }

                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('53', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {
                            "IS": {
                                "courses_dept": "math"
                            }
                        },
                        {
                            "OR": [ {
                                "IS": { "courses_instructor": "loewen, philip;paton, kelly"
                                }},
                                {"IS": {"courses_instructor": "liu*"}}
                            ]
                        }

                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it('54', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {
                            "OR": [
                                {"IS": {
                                    "courses_dept": "math"
                                }},
                                {"IS": {
                                    "courses_dept": "cpsc"
                                }}
                            ]
                        },
                        {
                            "OR": [ {
                                "IS": { "courses_instructor": "*holmes*"
                                }},
                                {"IS": {"courses_instructor": "patrice"}}
                            ]
                        }

                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_dept",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('55', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "EQ": {
                        "courses_avg": 97
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM": "hahhah"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('56', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "IS": {
                        "courses_avg": 89
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_foo",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM": "hahhah"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('57', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND": [
                        {"GT": {"courses_avg": 90}},
                        {"LT": {"courses_avg": 70}}
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_foo",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM": "TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);

        });
    });


    it('58', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "LT": {
                            "courses_avg": 90
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('59', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "EQ": {
                            "courses_avg": 50
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('60', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {

                    "AND": [
                        {"GT": {"courses_avg": 50}},
                        {"EQ": {"courses_avg": 11}}
                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_instructor",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('61', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "OR": [
                            {"LT": {"courses_avg": 80}},
                            {"GT": {"courses_avg": 70}}
                        ]
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('62', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('62.5', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "GT":{
                        "courses_avg":0
                    }
                }
                ,
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_title"
                    ],
                    "ORDER":"courses_title",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('63', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_haha",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('64', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER": 10,
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_dept": "math"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_haha",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.00', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND":  [
                        {"IS": {
                            "courses_dept": "math"}
                        },
                        {"IS": {
                            "courses_instructor": "*z"
                        }
                        }
                    ]
                }
                ,
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor",
                        "courses_pass"
                    ],
                    "ORDER":"courses_pass",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.01', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "GT": {"courses_avg": 88}
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor",
                        "courses_audit"
                    ],
                    "ORDER":"courses_audit",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.02', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "AND":  [
                        {"IS": {
                            "courses_dept": "math"}
                        },
                        {"IS": {
                            "courses_instructor": "*z"
                        }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor",
                        "courses_fail"
                    ],
                    "ORDER":"courses_fail",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.03', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "LT": {"courses_avg": 98}
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor",
                        "courses_pass",
                        "courses_uuid"
                    ],
                    "ORDER":"courses_uuid",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.04', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_instructor": "*alice"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.05', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {

                    "IS": {
                        "courses_instructor": "lic*"
                    }

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.06', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_instructor": "*z*"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.07', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[
                        {
                            "NOT": {
                                "AND":[
                                    {
                                        "GT":{
                                            "courses_avg":90
                                        }
                                    },
                                    {
                                        "IS":{
                                            "courses_foo":"adhe"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.08', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "coursesinstructor": "*z*"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.09', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "cours_esinstructor": "*z*"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });

    it('65.091', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "cours_esinstructor": "*z*"
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "coursesavg",
                        "coursesfail"
                    ],
                    "ORDER":"coursesavg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });

    it('65.092', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "IS": {
                            "courses_instructor": 100
                        }
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER": "courses_avg",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.093', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "OR": [ {
                        "LT": {"coursesavg": 100}
                    },
                        {
                            "GT": {"coursesavg": 100}
                        },
                        {
                            "EQ": {"coursesavg": 100}
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER": "courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.094', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "OR": [ {
                        "LT": {"courses_aavg": 100}
                    },
                        {
                            "GT": {"courses_aavg": 100}
                        },
                        {
                            "EQ": {"courses_aavg": 100}
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER": "courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.095', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "OR": [ {
                        "LT": {"cours_esavg": 100}
                    },
                        {
                            "GT": {"cours_esavg": 100}
                        },
                        {
                            "EQ": {"cours_esavg": 100}
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER": "courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });

    it('65.096', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "OR": [
                        {
                            "LT": {"courses_avg": "100"}
                        },
                        {
                            "GT": {"courses_avg": "100"}
                        },
                        {
                            "EQ": {"courses_avg": "100"}
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail"
                    ],
                    "ORDER": "courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.097', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {

                    "AND": [
                        {"GT": {"courses_avg": 50}},
                        {"EQ": {"courses_avg": 60}}
                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_dept",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.098', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {

                    "AND": [
                        {"EQ": {"courses_avg": 50}},
                        {"GT": {"courses_avg": 0}}
                    ]

                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_dept",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.099', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "NOT": {
                        "AND": [
                            {"GT": {"courses_avg": 50}},
                            {"EQ": {"courses_avg": 60}}
                        ]
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_instructor"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('65.1', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":[
                        {
                            "AND": {

                                "GT": {
                                    "courses_avg": 90
                                }
                                ,

                                "IS": {
                                    "courses_dept": "adhe"
                                }

                            }
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('65.2', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "OR":{

                        "AND": {

                            "GT": {
                                "courses_avg": 90
                            }
                            ,

                            "IS": {
                                "courses_dept": "adhe"
                            }

                        }
                        ,

                        "EQ":{
                            "courses_avg":95
                        }

                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_avg",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it('Fester0', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE": {
                    "IS": {
                        "courses_instructor": "*man"
                    }
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_dept",
                        "courses_avg",
                        "courses_fail",
                        "courses_uuid"

                    ],
                    "ORDER":"courses_uuid",
                    "FORM":"TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Fester1', function () {
        return insightFacade.performQuery(<any>
            {
                "WHERE": {
                    "IS": {
                        "courses_instructor": "man*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_dept",
                        "courses_avg",
                        "courses_fail",
                        "courses_uuid"
                    ],
                    "ORDER": "courses_uuid",
                    "FORM": "TABLE"
                }

            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Fester2', function () {
        return insightFacade.performQuery(<any>
            {
                "WHERE": {
                    "IS": {
                        "courses_instructor": "*joel*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_dept",
                        "courses_avg",
                        "courses_fail",
                        "courses_uuid",
                        "courses_instructor"
                    ],
                    "ORDER": "courses_uuid",
                    "FORM": "TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Firestorm', function () {
        return insightFacade.performQuery( <any>
            {
                "WHERE":{
                    "AND":[
                        {
                            "NOT": {
                                "IS":{
                                    "courses_instructor":"gao, xi"
                                }
                            }
                        },
                        {
                            "IS":{
                                "courses_dept":"cpsc"
                            }
                        }
                    ]
                },
                "OPTIONS":{
                    "COLUMNS":[
                        "courses_uuid",
                        "courses_id",
                        "courses_avg"
                    ],
                    "ORDER":"courses_uuid",
                    "FORM":"TABLE"
                }
            }
        ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('Fireball0: Should be able to find all courses in a dept with a partial name.'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE":{
                        "AND":[
                            {
                                "IS":{
                                    "courses_title":"*in*"
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"cpsc"
                                }
                            }
                        ]
                    },
                    "OPTIONS":{
                        "COLUMNS":[
                            "courses_uuid",
                            "courses_instructor",
                            "courses_id",
                            "courses_avg"
                        ],
                        "ORDER":"courses_uuid",
                        "FORM":"TABLE"
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Fireball1: Should be able to find all courses in a dept with a partial name.'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE":{
                        "AND":[
                            {
                                "IS":{
                                    "courses_title":"in*"
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"cpsc"
                                }
                            }
                        ]
                    },
                    "OPTIONS":{
                        "COLUMNS":[
                            "courses_uuid",
                            "courses_instructor",
                            "courses_id",
                            "courses_avg"
                        ],
                        "ORDER":"courses_uuid",
                        "FORM":"TABLE"
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Fireball2: Should be able to find all courses in a dept with a partial name.'
        , function () {
            return insightFacade.performQuery( <any>{
                    "WHERE":{
                        "AND":[
                            {
                                "IS":{
                                    "courses_title":"*in"
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"cpsc"
                                }
                            }
                        ]
                    },
                    "OPTIONS":{
                        "COLUMNS":[
                            "courses_uuid",
                            "courses_instructor",
                            "courses_id",
                            "courses_avg"
                        ],
                        "ORDER":"courses_uuid",
                        "FORM":"TABLE"
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });


    it('Firefly0: Should be able to find all instructurs in a dept with a partial name.'
        , function () {
            return insightFacade.performQuery( <any>
                { "WHERE":{
                    "AND":[
                        {
                            "IS":{
                                "courses_instructor":"*li*"
                            }
                        },
                        {
                            "IS":{
                                "courses_dept":"cpsc"
                            }
                        }
                    ]
                },
                    "OPTIONS":{
                        "COLUMNS":[
                            "courses_uuid",
                            "courses_instructor",
                            "courses_id",
                            "courses_avg"
                        ],
                        "ORDER":"courses_uuid",
                        "FORM":"TABLE"
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Firefly1: Should be able to find all instructurs in a dept with a partial name.'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE":{
                        "AND":[
                            {
                                "IS":{
                                    "courses_instructor":"li*"
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"cpsc"
                                }
                            }
                        ]
                    },
                    "OPTIONS":{
                        "COLUMNS":[
                            "courses_uuid",
                            "courses_instructor",
                            "courses_id",
                            "courses_avg"
                        ],
                        "ORDER":"courses_uuid",
                        "FORM":"TABLE"
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Firefly2: Should be able to find all instructurs in a dept with a partial name.'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE":{
                        "AND":[
                            {
                                "IS":{
                                    "courses_instructor":"*li"
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"cpsc"
                                }
                            }
                        ]
                    },
                    "OPTIONS":{
                        "COLUMNS":[
                            "courses_uuid",
                            "courses_instructor",
                            "courses_id",
                            "courses_avg"
                        ],
                        "ORDER":"courses_uuid",
                        "FORM":"TABLE"
                    }
                }
            ).then(function (response: InsightResponse) {
                expect(response.code).to.equal(200);
            }).catch(function (response: InsightResponse) {
                expect.fail();
            });
        });

    it('Test should fail when the transformations format is wrong 0'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformations format is wrong 1'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": "courses_id",
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 2'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id"],
                        "APPLY": {
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 3'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": [],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 4'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "coursesid"],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 5'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {
                        "GT": {
                            "rooms_seats": 10
                        }
                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "co_ursesid", "rooms_furniture", "courses_moha"],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(424);
            });
        });

    it('Test should fail when the transformation format is wrong 6'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id"],
                        "APPLY": [
                            "countProfs"
                        ]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 7'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id"],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            },
                            "haha": "moha"
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 8'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id"],
                        "APPLY": [{
                            "count_Profs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 9'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id"],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor",
                                "MAX": "courses_avg"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

    it('Test should fail when the transformation format is wrong 10'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_dept", "courses_id"],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "cours_esinstructor"
                            }
                        },
                            {
                                "hahha": {
                                    "MIN": "courses_instructor"
                                }
                            }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(424);
            });
        });

    it('Test should fail when the transformations format is wrong 11'
        , function () {
            return insightFacade.performQuery( <any>
                {
                    "WHERE": {

                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_id",
                            "countProfs"
                        ],
                        "FORM": "TABLE"
                    },
                    "TRANSFORMATIONS": {
                        "GROUP": ["courses_id", "rooms_furniture"],
                        "APPLY": [{
                            "countProfs": {
                                "COUNT": "courses_instructor"
                            }
                        }]
                    }
                }
            ).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });



    it('At the end of test, remove courses', function () {
        return insightFacade.removeDataset("courses").then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it('At the end of test, remove rooms', function () {
        return insightFacade.removeDataset("rooms").then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


});

