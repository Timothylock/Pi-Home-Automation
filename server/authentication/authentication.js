/**
 * Handles all of the authentication for a user
 */
var database = require('../storage/database');
var errors = require('../responses/errors');

module.exports = {
    authenticateUser: function (username, password, callback) {
        database.authenticateUser(username, password, callback);
    },

    // requiredLevel stops the user if their access level is not high enough
    requiredLevel: function (req, requireLevel, callback) {
        var credentials = new Buffer(req.get("authorization").split(" ").pop(), "base64").toString("ascii").split(":");

        database.getAccessLevel(credentials[0], function (lvl, err) {
            if (err !== null) {
                callback(false, err, null)
            }

            callback(lvl >= requireLevel, null, {
                "username": credentials[0],
                "password": credentials[1],
                "level": lvl
            })
        })
    }
};
