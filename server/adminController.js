/**
 * Contains the controller for the admin router routes
 */

var database = require('./storage/database');
var admin = require('./admin/admin');

module.exports = {
    temp: function (req, res) {
        res.send("Welcome");
    },

    postShutdown: admin.shutdownReciever
};
