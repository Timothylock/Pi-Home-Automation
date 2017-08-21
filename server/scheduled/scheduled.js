/**
 * Any scheduled functions that run every X interval lives here
 */
var fs = require('fs');

// UpdateLastOnline keeps the latest time that the server was up
function updateLastOnline() {
    fs.writeFile('data/lastonline.json', JSON.stringify(new Date()), 'utf8', function (err, data) {
    });
}

// Run the functions
updateLastOnline();

// Start the timers
setInterval(updateLastOnline, 60000 * 5);
