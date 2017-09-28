/**
 * Contains any database operation related functions
 */
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/home_monitor.db');
var exec = require('child_process').exec;
var sha1 = require('sha1');

module.exports = {
    // retrieveHistory returns a list of image file names for the last 10 door events
    retrieveHistory: function (callback) {
        db.all("SELECT type, details FROM (SELECT type, details FROM 'Log' ORDER BY timestamp DESC) WHERE type like '%door opened%' AND type != '' LIMIT 10", function (err, rows) {
            var history = [];
            var d = [];
            rows.forEach(function (row) {
                try {
                    d = row.details.split("/");
                    history.push(d[d.length - 1]);
                } catch (err) {
                    callback(history, err);
                }
            });
            callback(history, "");
        });
    },

    // retrieveLogs returns the last x number of log entries
    retrieveLogs: function (max, callback) {
        db.all("SELECT * FROM 'Log' ORDER BY timestamp DESC LIMIT 0," + max, function (err, rows) {
            callback(rows, err);
        });
    },

    // deleteLog deletes a log entry based on the timestamp.
    deleteLog: function (timestamp, callback) {
        db.run("DELETE FROM Log WHERE timestamp=\"" + timestamp + "\"", callback);
    },

    // changeWemoPassword changes the wemo user's sha1 password and set the real_name as the password
    changeWemoPassword: function (password, callback) {
        db.run("UPDATE Users SET password = \"" + sha1(password) + "\", real_name = \"" + password + "\" WHERE username = \"wemo\";", callback);
    },

    // addLog adds a specific data to the log (for remote connections)
    addLog: function (username, action, details, opt) {
        var ip, ua;
        if ('req' in opt) {
            ip = opt['req'].headers['x-forwarded-for'] || opt['req'].connection.remoteAddress;
            ua = opt['req'].headers['user-agent'];
        } else {
            ip = "::ffff:127.0.0.1";
            ua = "localhost";
        }

        db.serialize(function () {
            if (ua === undefined) {
                db.run("INSERT INTO Log (username, type, details, origin) VALUES (\"" + username + "\",\"" + action + "\",\"" + details + "\",\"" + ip + "\")");
            } else {
                db.run("INSERT INTO Log (username, type, details, origin) VALUES (\"" + username + "\",\"" + action + "\",\"" + details + "\",\"" + ip + ua.replace(/,/g, "---") + "\")");
            }
        });
    },

    // getRealName retrieves the password of an api user or the real name of a normal user
    getRealName: function (username, callback) {
        db.get("SELECT real_name FROM Users WHERE username = \"" + username + "\"", function (err, row) {
            if (err !== null) {
                callback("");
            }

            if (row === undefined) {
                callback("");
            }

            callback(row.real_name);
        });
    },

    // getAccessLevel gets the access level of a particular user
    getAccessLevel: function (username, callback) {
        db.get("SELECT access_level FROM Users WHERE username = \"" + username + "\"", function (err, row) {
            if (err !== null) {
                callback(null, err);
            }

            if (row === undefined) {
                callback(null, new Error("user does not exist"));
            }

            callback(row.access_level, null);
        });
    },

    // authenticateUser retrieves the password of a user and checks to see if the sha1 matches
    authenticateUser: function (username, password, callback) {
        db.get("SELECT password FROM Users WHERE username = \"" + username + "\"", function (err, row) {
            if (err !== null) {
                callback(err, false);
            }

            try {
                callback(null, row.password === sha1(password));
            } catch (err) {
                callback(null, false);
            }
        });
    },

    // getUsers gets a list of users
    getUsers: function (callback) {
        db.all("SELECT username, real_name, access_level FROM 'Users'", function (err, rows) {
            callback(rows, err);
        });
    },

    // AddUser adds a new user
    addUser: function (username, password, realName, accessLevel, callback) {
        db.run("REPLACE INTO Users (username, password, real_name, access_level) VALUES (\"" + username + "\", \"" + sha1(password) + "\", \"" + realName + "\"," + accessLevel + ");", callback);
    },

    // deleteUser deletes an existing user
    deleteUser: function (username, callback) {
        db.run("DELETE FROM Users WHERE username=\"" + username + "\"", callback);
    },

    // takePicture takes a picture and stores it to the specified folder
    takePicture: function (location) {
        exec("fswebcam -r 1280x960 " + location, this.putsPictureError);
    },

    // putsPictureError adds and entry into the log
    putsPictureError: function (error, stdout, stderr) {
        module.exports.addLog("system", "Picture Error", error + " " + stderr, {});
    }
};


