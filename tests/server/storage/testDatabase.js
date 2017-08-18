/**
 * Tests the database functions
 */
var chai = require('chai');
var database = require('./../../../server/storage/database');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/home_monitor.db');
var sha1 = require('sha1');

setTimeout(function () {
    var uname = "testinguser";
    var password = "testingpassword";

    // Setup the db
    db.serialize(function () {
        db.run("INSERT OR IGNORE INTO Users (userid, username, password, real_name, access_level) VALUES (99901, \"" + uname + "\", \"" + sha1(password) + "\", \"Testinguser\", 10)");
    });

    describe('authenticateUser', function () {
        it("authenticateUser() should return true for " + uname + " and " + password, function (done) {
            database.authenticateUser(uname, password, function (err, result) {
                if (result === true) {
                    done();
                } else {
                    done(new Error("Received " + result));
                }
            });
        });

        it("authenticateUser() should return false for " + uname + " and " + password + "wrong", function (done) {
            database.authenticateUser(uname, password + "wrong", function (err, result) {
                if (result === false) {
                    done();
                } else {
                    done(new Error("Received " + result));
                }
            });
        });
    });

    run();
}, 5000);

