/**
 * Handles all of the authentication for a user
 */
var database = require('../storage/database');

module.exports = {
    authenticateUser: function (username, password, callback) {
        database.authenticateUser(username, password, callback);
    }
};
