/**
 * Handles all of the admin functions
 */
var database = require('../storage/database');

module.exports = {
    shutdownReciever: function (req, res) {
        if (res.query.pw == "pass") {
            res.send("success");
            database.addLog(0, res.query.op + " initiated", "SUCCESS", {'req': req}); // TODO: Lookup userID
            shutdownHandler(req.query.op, function (msg) {
                res.send(msg);
                database.addLog(0, "Shutdown/Reboot Initiated", "", {'req': req}); // TODO: Lookup userID
            });
        } else {
            res.status(403);
            res.send("Incorrect administrator secret");
            database.addLog(0, res.query.op + " attempted", "UNAUTHENTICATED", {'req': req}); // TODO: Lookup userID
        }
    },

    shutdownRecieverInternal: function (op) {
        database.addLog(0, "Shutdown/Reboot Initiated", "", {'req': req});
        shutdownHandler(req.query.op, function (msg) {

        });
    }
};

function shutdownHandler(op, callback) {
    if (op == "shutdown") {
        exec('shutdown now', function (error, stdout, stderr) {
            callback(stdout);
        });
    } else if (op == "reboot") {
        exec('shutdown -r now', function (error, stdout, stderr) {
            callback(stdout);
        });
    }
}
