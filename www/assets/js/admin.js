/**
 * Created by timothylock on 2017-08-26.
 */
$.ajax({
    url: '/api/admin/version',
    type: 'GET',
    success: function (response) {
        console.log(response);
        $("#revision").html("Server running version: <a href=\"https://github.com/Timothylock/Pi-Home-Automation/tree/" + response.version + "\">" + response.version + "</a>")
    },
    error: function (response) {
        console.log("Cannot retrieve revision - " + response.responseText)
    }
});

function getLogs() {
    $.ajax({
        url: '/api/admin/logs',
        type: 'GET',
        success: function (response) {
            var result = "";
            for (var i = 0; i < response.length; i++) {
                (function (i) {
                    result += "<tr><td>" + response[i].timestamp + "</td><td>" + response[i].userid + "</td><td>" + response[i].type + "</td><td>" + response[i].details + "</td><td>" + response[i].origin + "</td><td><button onclick='deleteLog(\"" + response[i].timestamp + "\")' type='button' class='btn btn-danger'>Delete</button></td></tr>"
                })(i);
            }
            $("#logbody").html(result);
        },
        error: function (response) {
            $("#logbody").html("<tr><td>Error</td><td>Error</td><td>Error</td><td>Error</td><td>Error</td><td>Error</td></tr>");
            console.log("Cannot retrieve logs - " + JSON.parse(response.responseText).details)
        }
    });
}

function deleteLog(timestamp) {
    confirm("You're about to delete " + timestamp + ". This cannot be undone! Do you want to proceed?");
    $.ajax({
        url: '/api/admin/logs?timestamp=' + timestamp,
        type: 'DELETE',
        success: function () {
            alert("Log entry " + timestamp + " deleted");
        },
        error: function (response) {
            alert("Could not delete " + timestamp + ". " + response.responseText);
        }
    });
    getLogs();
}
