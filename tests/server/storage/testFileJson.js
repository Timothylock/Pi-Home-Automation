/**
 * Tests the Json file functions
 */
var chai = require('chai');
var fileJSON = require('./../../../server/storage/fileJson');
var fs = require('fs');

describe('fileJson', function () {
    it("writing status to JSON file", function (done) {
        var testStatus = {
            "blindsMotion": 0,
            "blindsStatus": 1,
            "door": 0,
            "motion": 0,
            "lights": [{"name": "Bedroom Lights", "id": 27, "status": "off"}, {
                "name": "Hallway Floor Lights",
                "id": 18,
                "status": "off"
            }, {"name": "Living Room Lights", "id": 17, "status": "on"}, {
                "name": "Living Room Outlets",
                "id": 22,
                "status": "off"
            }],
            "numLightsOn": 1
        };

        fileJSON.writeStatus(testStatus);

        fs = require('fs')
        fs.readFile('data/status.json', 'utf8', function (err, data) {
            if (err !== null) {
                done(err);
            } else if (data === JSON.stringify(testStatus)) {
                done();
            } else {
                done(new Error("Expected " + JSON.stringify(testStatus) + " but got " + data));
            }
        });

    });
});

