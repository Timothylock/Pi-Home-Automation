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

    // changeWemoPassword changes the wemo user's sha1 password and set the real_name as the password
    changeWemoPassword: function (password, callback) {
        console.log(password);
        db.run("UPDATE Users SET password = \"" + sha1(password) + "\", real_name = \"" + password + "\" WHERE userid = 2;", callback);
    },

    // addLog adds a specific data to the log (for remote connections)
    addLog: function (userid, action, details, opt) {
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
                db.run("INSERT INTO Log (userid, type, details, origin) VALUES (" + userid + ",\"" + action + "\",\"" + details + "\",\"" + ip + "\")");
            } else {
                db.run("INSERT INTO Log (userid, type, details, origin) VALUES (" + userid + ",\"" + action + "\",\"" + details + "\",\"" + ip + ua.replace(/,/g, "---") + "\")");
            }
        });
    },

    // getRealName retrieves the password of an api user or the real name of a normal user
    getRealName: function (username, callback) {
        db.get("SELECT real_name FROM Users WHERE username = \"" + username + "\"", function (err, row) {
            if (err !== null) {
                callback("");
            }
            callback(row.real_name);
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

    // takePicture takes a picture and stores it to the specified folder
    takePicture: function (location) {
        exec("fswebcam -r 1280x960 " + location, this.putsPictureError);
    },

    // putsPictureError adds and entry into the log
    putsPictureError: function (error, stdout, stderr) {
        module.exports.addLog(1, "Picture Error", error + " " + stderr, {});
    }
};


