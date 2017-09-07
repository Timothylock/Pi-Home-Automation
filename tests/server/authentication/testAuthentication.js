/**
 * Tests the authentication functions
 */
var chai = require('chai');
var auth = require('./../../../server/authentication/authentication');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/home_monitor.db');
var sha1 = require('sha1');
var httpMocks = require('node-mocks-http');

var uname = "testinguser2";
var password = "testingpassword2";

describe('authentication', function () {
    // Set up the db
    before(function (done) {
        db.run("INSERT OR IGNORE INTO Users (username, password, real_name, access_level) VALUES (\"" + uname + "\", \"" + sha1(password) + "\", \"Testinguser\", 10)", function () {
            done();
        });
    });

    it("failure authentication", function (done) {
        auth.authenticateUser(uname, password + "wrong", function (err, result) {
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
        auth.authenticateUser(uname, password, function (err, result) {
            if (err !== null) {
                done(err);
            } else if (result === true) {
                done();
            } else {
                done(new Error("Expected true but got " + result));
            }
        });
    });

    it("requiredLevel passed required level", function (done) {
        db.run("INSERT OR IGNORE INTO Users (username, password, real_name, access_level) VALUES (\"testAuthRequiredLevel\", \"" + "doesntmatter" + "\", \"Test getAccessLevel\", 2)", function () {
            var req = httpMocks.createRequest({
                method: 'GET',
                url: '/api/status',
                headers: {
                    authorization: "Basic dGVzdEF1dGhSZXF1aXJlZExldmVsOmRvZXNudG1hdHRlcg=="
                }
            });

            auth.requiredLevel(req, 2, function (good, err) {
                if (err !== null) {
                    done(err);
                }

                if (!good) {
                    done("Expected true, but got " + good);
                } else {
                    done();
                }
            })
        });

    });

    it("requiredLevel fail required level", function (done) {
        db.run("INSERT OR IGNORE INTO Users (username, password, real_name, access_level) VALUES (\"testAuthRequiredLevel\", \"" + "doesntmatter" + "\", \"Test getAccessLevel\", 1)", function () {
            var req = httpMocks.createRequest({
                method: 'GET',
                url: '/api/status',
                headers: {
                    authorization: "Basic dGVzdEF1dGhSZXF1aXJlZExldmVsOmRvZXNudG1hdHRlcg=="
                }
            });

            auth.requiredLevel(req, 2, function (good, err) {
                if (err !== null) {
                    done(err);
                }

                if (!good) {
                    done("Expected true, but got " + good);
                } else {
                    done();
                }
            })
        });

    });
});

