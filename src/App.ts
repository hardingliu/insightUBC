/**
 * Starts the server. It is unlikely you will have to change anything here.
 */
import Server from './rest/Server';
import Log from './Util';

// For adding the dataset when the server starts.
import InsightFacade from "./model/InsightFacade";
import fs = require("fs");

/**
 * Starts the server; doesn't listen to whether the start was successful.
 */
export class App {
    public initServer(port: number) {

        // add the dataset when starting the server
        let courses: any = fs.readFileSync(__dirname + "/../test/courses.zip");
        let rooms: any = fs.readFileSync(__dirname + "/../test/rooms.zip");

        let insightFacade: InsightFacade = new InsightFacade();

        insightFacade.addDataset("courses", courses).then().catch();
        insightFacade.addDataset("rooms", rooms).then().catch();

        Log.info('App::initServer( ' + port + ' ) - start');
        let s = new Server(port);
        s.start().then(function (val: boolean) {
            Log.info("App::initServer() - started: " + val);
        }).catch(function (err: Error) {
            Log.error("App::initServer() - ERROR: " + err.message);
        });
    }
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
Log.info('App - starting');
let app = new App();
app.initServer(4321);
