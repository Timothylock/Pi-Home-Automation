/**
 * Contains any database operation related functions
 */
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/home_monitor.db');
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
                    console.log(err);
                }
            });
            callback(history);
        });
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
            db.run("INSERT INTO Log (userid, type, details, origin) VALUES (" + userid + ",\"" + action + "\",\"" + details + "\",\"" + ip + ua.replace(/,/g, "---") + "\")");
        });
    },

    // authenticateUser retrieves the password of a user
    authenticateUser: function (username, password, callback) {
        db.get("SELECT password FROM Users WHERE username = \"" + username + "\"", function (err, row) {
            try {
                callback(null, row.password === sha1(password));
            } catch (err) {
                callback(null, false);
            }
        });
    }
};
