/**
 * Created by rtholmes on 2016-10-31.
 */

import Server from "../src/rest/Server";
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/model/IInsightFacade";
import fs = require('fs');
import {Response} from "restify";
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);


describe("EchoSpec", function () {
    this.timeout(100000);

    function sanityCheck(response: InsightResponse) {
        expect(response).to.have.property('code');
        expect(response).to.have.property('body');
        expect(response.code).to.be.a('number');
    }


    let server:Server = new Server(4321);

    before(function () {
        server.start().then().catch();
        Log.test('Before: ' + (<any>this).test.parent.title);
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        server.stop().then().catch();
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    it("Should be able to echo", function () {
        let out = Server.performEcho('echo');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: 'echo...echo'});
    });

    it("Should be able to echo silence", function () {
        let out = Server.performEcho('');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: '...'});
    });

    it("Should be able to handle a missing echo message sensibly", function () {
        let out = Server.performEcho(undefined);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("Should be able to handle a null echo message sensibly", function () {
        let out = Server.performEcho(null);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.have.property('error');
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("PUT should fail", function () {
        return chai.request('http://localhost:4321')
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync(__dirname + "/empty.zip"), "/empty.zip")
            .then(function (res: Response) {
                expect.fail();

            })
            .catch(function (err: any) {
                expect(err).to.have.status(400);
            });
    });

    it("POST should fail", function () {
        return chai.request('http://localhost:4321')
            .post('/query')
            .send({
                "WHERE": {
                    "IS": {
                        "rooms_name": "DMP_*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_name"
                    ]
                }
            })
            .then(function (res: Response) {
                // Log.trace('then:');
                // some assertions
                expect.fail();
            })
            .catch(function (err: any) {
                // Log.trace('catch:');
                // some assertions
                expect(err).to.have.status(400);
            });
    });

    it("PUT description for rooms", function () {
        return chai.request('http://localhost:4321')
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync(__dirname + "/rooms.zip"), "/rooms.zip")
            .then(function (res: Response) {
                // expect(res).to.have.status(201);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("PUT description for courses", function () {
        return chai.request('http://localhost:4321')
            .put('/dataset/courses')
            .attach("body", fs.readFileSync(__dirname + "/courses.zip"), "/courses.zip")
            .then(function (res: Response) {
                // expect(res).to.have.status(201);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });


    it("POST description for rooms", function () {
        return chai.request('http://localhost:4321')
            .post('/query')
            .send({
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
            })
            .then(function (res: Response) {
                expect(res).to.have.status(200);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("DELETE description for rooms", function () {
        return chai.request('http://localhost:4321')
            .del('/dataset/rooms')
            .then(function (res: Response) {
                expect(res).to.have.status(204);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("DELETE description for courses", function () {
        return chai.request('http://localhost:4321')
            .del('/dataset/courses')
            .then(function (res: Response) {
                expect(res).to.have.status(204);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });
});
