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
    this.timeout(5000);

    // Set up the db
    before(function (done) {
        database.addLog(1, "testevent", "testdetails", {});
        database.addLog(12, "testeventheaders", "testdetailsheaders", {
            "req": {
                "headers": {
                    "x-forwarded-for": "testingforwarded",
                    "user-agent": "testagent"
                }
            }
        });
        database.addLog(13, "testeventheaders", "testdetailsheaders", {
            "req": {
                "headers": {
                    "x-forwarded-for": "testingforwarded"
                }
            }
        });
        db.run("INSERT OR IGNORE INTO Users (userid, username, password, real_name, access_level) VALUES (99901, \"" + uname + "\", \"" + sha1(password) + "\", \"Testinguser\", 10)", function () {
            db.run("INSERT INTO Log (userid, type, details, origin) VALUES (1,\"door opened test\",\"testdetails.jpg\",\"localhosttest\")", function () {
                db.run("INSERT INTO Log (userid, type, details, origin) VALUES (1,\"door closed test\",\"testdetails.jpg\",\"localhosttest\")", function () {
                    db.run("INSERT INTO Log (userid, type, details, origin) VALUES (1,\"door opened test\",\"testdetails2.jpg\",\"localhosttest\")", function () {
                        db.run("INSERT INTO Log (timestamp, userid, type, details, origin) VALUES (\"1990-08-25 23:28:56\", 1,\"delete test\",\"details\",\"localhosttest\")", function () {
                            database.changeWemoPassword(password, function () {
                                database.takePicture("somedir");
                                done();
                            });
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

    it("get real_name success", function (done) {
        database.getRealName(uname, function (result) {
            if (result === "Testinguser") {
                done();
            } else {
                done(new Error("Expected Testinguser but got " + result));
            }
        });
    });

    it("get real_name no entry", function (done) {
        database.getRealName(uname + "does_not_exist", function (result) {
            if (result === "") {
                done();
            } else {
                done(new Error("Expected nothing but got " + result));
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

    it("verify log entry added when no headers sent in", function (done) {
        db.get("SELECT userid, type, details, origin FROM Log WHERE userid=1 AND type=\"testevent\" AND details=\"testdetails\" AND origin=\"::ffff:127.0.0.1localhost\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"userid\":1,\"type\":\"testevent\",\"details\":\"testdetails\",\"origin\":\"::ffff:127.0.0.1localhost\"}") {
                done();
            } else {
                done(new Error("Expected {\"userid\":1,\"type\":\"testevent\",\"details\":\"testdetails\",\"origin\":\"::ffff:127.0.0.1localhost\"} but got " + JSON.stringify(row)));
            }
        });
    });

    it("verify log entry added when headers sent in", function (done) {
        db.get("SELECT userid, type, details, origin FROM Log WHERE userid=12 AND type=\"testeventheaders\" AND details=\"testdetailsheaders\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"userid\":12,\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwardedtestagent\"}") {
                done();
            } else {
                done(new Error("Expected {\"userid\":12,\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwardedtestagent\"} but got " + JSON.stringify(row)));
            }
        });
    });

    it("verify log entry added when headers sent in but no user agent", function (done) {
        db.get("SELECT userid, type, details, origin FROM Log WHERE userid=13 AND type=\"testeventheaders\" AND details=\"testdetailsheaders\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"userid\":13,\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwarded\"}") {
                done();
            } else {
                done(new Error("Expected {\"userid\":13,\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwarded\"} but got " + JSON.stringify(row)));
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

    it("verify retrieveLogs returning same rows as max", function (done) {
        database.retrieveLogs(2, function (rows, err) {
            if (err !== "") {
                done(err);
            } else if (rows.length !== 2) {
                done(new Error('Expected 2 rows to be returned back, but got ' + rows.length));
            } else {
                done();
            }
        })
    });

    it("deleting log entry", function (done) {
        db.get("SELECT count() as count from Log", function (err, row) {
            if (err !== null) {
                done(err);
            }

            var before = row.count;

            database.deleteLog("1990-08-25 23:28:56", function () {
                db.get("SELECT count() as count from Log", function (err, row) {
                    if (err !== null) {
                        done(err);
                    }

                    var after = row.count;

                    if (before - after === 1) {
                        done();
                    } else {
                        done(new Error("Expected " + before - 1 + "rows, but got " + after + "rows"));
                    }
                });
            })
        });
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
