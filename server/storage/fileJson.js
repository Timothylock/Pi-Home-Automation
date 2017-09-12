/**
 * Functions for the legacy way of serializing json into files. In the future they should all be in the database
 */
var fs = require('fs');
var db = require('./../storage/database');

module.exports = {
    // Write status to a file
    writeStatus: function (status) {
        fs.writeFile('data/status.json', JSON.stringify(status), 'utf8', function (err, data) {
            if (err === null) {
                db.addLog("system", "writeStatus error", err, {});
            }
        });
    }
};

