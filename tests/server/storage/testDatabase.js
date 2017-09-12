/**
 * Tests the database functions
 */
var chai = require('chai');
var database = require('./../../../server/storage/database');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/home_monitor.db');
var sha1 = require('sha1');

describe('database', function () {
    this.timeout(5000);

    // Set up the db
    before(function (done) {
        db.run("INSERT OR IGNORE INTO Users (username, password, real_name, access_level) VALUES (\"testinguser\", \"" + sha1("testpassword") + "\", \"Testinguser\", 10)", function () {
            db.run("INSERT INTO Log (username, type, details, origin) VALUES (\"1\",\"door opened test\",\"testdetails.jpg\",\"localhosttest\")", function () {
                db.run("INSERT INTO Log (username, type, details, origin) VALUES (\"1\",\"door closed test\",\"testdetails.jpg\",\"localhosttest\")", function () {
                    db.run("INSERT INTO Log (username, type, details, origin) VALUES (\"1\",\"door opened test\",\"testdetails2.jpg\",\"localhosttest\")", function () {
                        database.changeWemoPassword("testpasswordwemo", function () {
                            database.takePicture("somedir");
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
                            done();
                        });
                    });
                });
            });
        });
    });

    it("failure authentication", function (done) {
        database.authenticateUser("testinguser", "wrong", function (err, result) {
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
        database.authenticateUser("testinguser", "testpassword", function (err, result) {
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
        database.getRealName("testinguser", function (result) {
            if (result === "Testinguser") {
                done();
            } else {
                done(new Error("Expected Testinguser but got " + result));
            }
        });
    });

    it("get real_name no entry", function (done) {
        database.getRealName("does_not_exist", function (result) {
            if (result === "") {
                done();
            } else {
                done(new Error("Expected nothing but got " + result));
            }
        });
    });

    it("successful after changeWemoPassword authentication", function (done) {
        database.authenticateUser("wemo", "testpasswordwemo", function (err, result) {
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
        db.get("SELECT username, type, details, origin FROM Log WHERE username=\"1\" AND type=\"testevent\" AND details=\"testdetails\" AND origin=\"::ffff:127.0.0.1localhost\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"username\":\"1\",\"type\":\"testevent\",\"details\":\"testdetails\",\"origin\":\"::ffff:127.0.0.1localhost\"}") {
                done();
            } else {
                done(new Error("Expected {\"username\":\"1\",\"type\":\"testevent\",\"details\":\"testdetails\",\"origin\":\"::ffff:127.0.0.1localhost\"} but got " + JSON.stringify(row)));
            }
        });
    });

    it("verify log entry added when headers sent in", function (done) {
        db.get("SELECT username, type, details, origin FROM Log WHERE username=\"12\" AND type=\"testeventheaders\" AND details=\"testdetailsheaders\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"username\":\"12\",\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwardedtestagent\"}") {
                done();
            } else {
                done(new Error("Expected {\"username\":\"12\",\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwardedtestagent\"} but got " + JSON.stringify(row)));
            }
        });
    });

    it("verify log entry added when headers sent in but no user agent", function (done) {
        db.get("SELECT username, type, details, origin FROM Log WHERE username=\"13\" AND type=\"testeventheaders\" AND details=\"testdetailsheaders\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"username\":\"13\",\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwarded\"}") {
                done();
            } else {
                done(new Error("Expected {\"username\":\"13\",\"type\":\"testeventheaders\",\"details\":\"testdetailsheaders\",\"origin\":\"testingforwarded\"} but got " + JSON.stringify(row)));
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
        db.run("INSERT INTO Log (timestamp, username, type, details, origin) VALUES (\"1990-08-25 23:28:56\", 1,\"delete test\",\"details\",\"localhosttest\")", function () {
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
    });

    it("Adding new user", function (done) {
        database.addUser("addTestUser", "testingpassword", "Testing User", 12, function () {
            db.get("SELECT * FROM Users WHERE username=\"addTestUser\"", function (err, row) {
                if (err !== null) {
                    done(err);
                } else if (JSON.stringify(row) === '{"username":"addTestUser","password":"baee6206dfe8af3451bd66f68a7fe76ab4cf1743","real_name":"Testing User","access_level":12}') {
                    done();
                } else {
                    done(new Error('Expected {"username":"addTestUser","password":"baee6206dfe8af3451bd66f68a7fe76ab4cf1743","real_name":"Testing User","access_level":12}, but got ' + JSON.stringify(row)));
                }
            });
        });
    });

    it("Deleting a user", function (done) {
        db.run("INSERT OR IGNORE INTO Users (username, password, real_name, access_level) VALUES (\"testUserDelete\", \"" + sha1("testpassword") + "\", \"Testinguser\", 10)", function () {
        db.get("SELECT count() as count from Users", function (err, row) {
            if (err !== null) {
                done(err);
            }

            var before = row.count;

            database.deleteUser("testUserDelete", function () {
                db.get("SELECT count() as count from Users", function (err, row) {
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
    });

    it("Getting a list of users", function (done) {
        database.getUsers(function (rows, err) {
            if (err !== null) {
                done(err);
            }

            var usernames = [];

            for (var i = 0; i < rows.length; i++) {
                usernames.push(rows[i].username);
            }

            if (usernames.includes("wemo") && usernames.includes("testuser") && usernames.includes("system")) {
                done();
            } else {
                done(new Error("Expected wemo, testuser, system to be in the list of users, but instead got " + usernames));
            }
        })
    });

    it("Getting the access level of an unknown user", function (done) {
        database.getAccessLevel("doesnotexist", function (lvl, err) {
            if (lvl !== null) {
                done(new Error("Expected a null level but got " + lvl));
            } else if (err === null) {
                done(new Error("Expected a non-null error but got a null error"));
            } else {
                done()
            }
        })
    });

    it("Getting the access level of a known user", function (done) {
        db.run("INSERT OR IGNORE INTO Users (username, password, real_name, access_level) VALUES (\"testGetAccessLevel\", \"" + "doesntmatter" + "\", \"Test getAccessLevel\", 2)", function () {
            database.getAccessLevel("testGetAccessLevel", function (lvl, err) {
                if (lvl !== 2) {
                    done(new Error("Expected level to be 2 but got " + lvl));
                } else if (err !== null) {
                    done(new Error("Expected a null error but got " + err));
                } else {
                    done()
                }
            })
        });
    });

    it("take picture failure", function (done) {
        db.get("SELECT username, type FROM Log WHERE username=\"system\" AND type=\"Picture Error\"", function (err, row) {
            if (err !== null) {
                done(err);
            } else if (JSON.stringify(row) === "{\"username\":\"system\",\"type\":\"Picture Error\"}") {
                done();
            } else {
                done(new Error("Expected {\"username\":\"system\",\"type\":\"Picture Error\"} but got " + JSON.stringify(row)));
            }
        });
    });
});

