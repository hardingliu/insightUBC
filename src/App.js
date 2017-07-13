"use strict";
var Server_1 = require("./rest/Server");
var Util_1 = require("./Util");
var InsightFacade_1 = require("./controller/InsightFacade");
var fs = require("fs");
var App = (function () {
    function App() {
    }
    App.prototype.initServer = function (port) {
        var courses = fs.readFileSync(__dirname + "/../test/courses.zip");
        var rooms = fs.readFileSync(__dirname + "/../test/rooms.zip");
        var insightFacade = new InsightFacade_1.default();
        insightFacade.addDataset("courses", courses).then().catch();
        insightFacade.addDataset("rooms", rooms).then().catch();
        Util_1.default.info('App::initServer( ' + port + ' ) - start');
        var s = new Server_1.default(port);
        s.start().then(function (val) {
            Util_1.default.info("App::initServer() - started: " + val);
        }).catch(function (err) {
            Util_1.default.error("App::initServer() - ERROR: " + err.message);
        });
    };
    return App;
}());
exports.App = App;
Util_1.default.info('App - starting');
var app = new App();
app.initServer(4321);
//# sourceMappingURL=App.js.map