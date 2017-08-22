/**
 * Tests the database functions
 */
var chai = require('chai');
var database = require('./../../../server/storage/database');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/home_monitor.db');
var sha1 = require('sha1');

var uname = "testinguser";
var password = "testingpassword";

describe('database', function () {
    // Set up the db
    before(function (done) {
        database.addLog(1, "testevent", "testdetails", {});
        db.run("INSERT OR IGNORE INTO Users (userid, username, password, real_name, access_level) VALUES (99901, \"" + uname + "\", \"" + sha1(password) + "\", \"Testinguser\", 10)", function () {
            db.run("INSERT INTO Log (userid, type, details, origin) VALUES (1,\"door opened test\",\"testdetails.jpg\",\"localhosttest\")", function () {
                db.run("INSERT INTO Log (userid, type, details, origin) VALUES (1,\"door closed test\",\"testdetails.jpg\",\"localhosttest\")", function () {
                    db.run("INSERT INTO Log (userid, type, details, origin) VALUES (1,\"door opened test\",\"testdetails2.jpg\",\"localhosttest\")", function () {
                        database.changeWemoPassword(password, function () {
                            database.takePicture("somedir");
                            done();
                        });
                    });
                });
            });
        });
    });

    it("failure authentication", function (done) {
        database.authenticateUser(uname, password + "wrong", function (err, result) {
            if (err !== null) {
                done(err);
            } else if (result === false) {
                done();
            } else {
                done(new Error("Expected false but got " + result));
            }
        });
    });

    it("successful authentication", function (done) {
        database.authenticateUser(uname, password, function (err, result) {
            if (err !== null) {
                done(err);
            } else if (result === true) {
                done();
            } else {
                done(new Error("Expected true but got " + result));
            }
        });
    });

    it("get real_name", function (done) {
        database.getRealName(uname, function (result) {
            if (result === "Testinguser") {
                done();
            } else {
                done(new Error("Expected Testinguser but got " + result));
            }
        });
    });

    it("successful after changeWemoPassword authentication", function (done) {
        database.authenticateUser("wemo", password, function (err, result) {
            if (err !== null) {
                done(err);
            } else if (result === true) {
                done();
            } else {
                done(new Error("Expected true but got " + result));
            }
        });
    });

    it("verify log entry added", function (done) {
        db.get("SELECT userid, type, details FROM Log WHERE userid=1 AND type=\"testevent\" AND details=\"testdetails\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"userid\":1,\"type\":\"testevent\",\"details\":\"testdetails\"}") {
                done();
            } else {
                done(new Error("Expected {\"userid\":1,\"type\":\"testevent\",\"details\":\"testdetails\"} but got " + JSON.stringify(row)));
            }
        });
    });

    it("verify retrieveHistory returning correct details", function (done) {
        database.retrieveHistory(function (history) {
            if (JSON.stringify(history) === '["testdetails.jpg","testdetails2.jpg"]') {
                done();
            } else {
                done(new Error('Expected ["testdetails.jpg","testdetails2.jpg"] but got ' + JSON.stringify(history)));
            }
        })
    });

    it("take picture failure", function (done) {
        db.get("SELECT userid, type FROM Log WHERE userid=1 AND type=\"Picture Error\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"userid\":1,\"type\":\"Picture Error\"}") {
                done();
            } else {
                done(new Error("Expected {\"userid\":1,\"type\":\"Picture Error\"} but got " + JSON.stringify(row)));
            }
        });
    });
});

