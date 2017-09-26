/**
 * Created by timothylock on 2017-08-26.
 */
$.ajax({
    url: '/api/admin/version',
    type: 'GET',
    success: function (response) {
        $("#revision").html("Server running version: <a href=\"https://github.com/Timothylock/Pi-Home-Automation/tree/" + response.version + "\">" + response.version + "</a>")
    },
    error: function (response) {
        console.log("Cannot retrieve revision - " + response.responseText)
    }
});

function loadServerUpdateInfo() {
    var text = "";
    var curr = "";
    var latest = "";
    $.ajax({
        url: '/api/admin/version',
        type: 'GET',
        success: function (response) {
            curr = response.version;
            text += '<p>Server running version: <a href=\"https://github.com/Timothylock/Pi-Home-Automation/tree/' + response.version + "\">" + response.version + "</a></p>";
            $.ajax({
                url: 'https://api.github.com/repos/timothylock/Pi-Home-Automation/commits/master',
                type: 'GET',
                success: function (response) {
                    latest = response.sha;
                    text += '<p>Latest version: <a href=\"https://github.com/Timothylock/Pi-Home-Automation/tree/' + response.sha + "\">" + response.sha + "</a></p>";
                    if (latest != curr) {
                        text = '<p style="color:limegreen">A new version is available!</p>' + text;
                    } else {
                        text = '<p>Currently running the latest version</p>' + text;
                    }

                    $("#updateInfo").html(text);
                },
                error: function (response) {
                    $("#updateInfo").html("Error retrieving data");
                    console.log("Cannot retrieve latest revision - " + response.responseText)
                }
            });
        },
        error: function (response) {
            $("#updateInfo").html("Error retrieving data");
            console.log("Cannot retrieve current revision - " + response.responseText)
        }
    });
}

function getLogs() {
    $.ajax({
        url: '/api/admin/logs',
        type: 'GET',
        success: function (response) {
            var result = "";
            for (var i = 0; i < response.length; i++) {
                (function (i) {
                    result += "<tr><td>" + response[i].timestamp + "</td><td>" + response[i].username + "</td><td>" + response[i].type + "</td><td>" + response[i].details + "</td><td>" + response[i].origin + "</td><td><button onclick='deleteLog(\"" + response[i].timestamp + "\")' type='button' class='btn btn-danger'>Delete</button></td></tr>"
                })(i);
            }
            $("#logbody").html(result);
        },
        error: function (response) {
            $("#logbody").html("<tr><td>Error</td><td>Error</td><td>Error</td><td>Error</td><td>Error</td><td>Error</td></tr>");
            alert("Cannot retrieve logs - " + JSON.parse(response.responseText).details);
        }
    });
}

function deleteLog(timestamp) {
    if (confirm("You're about to delete " + timestamp + ". This cannot be undone! Do you want to proceed?")) {
        $.ajax({
            url: '/api/admin/logs?timestamp=' + timestamp,
            type: 'DELETE',
            success: function () {
                getLogs();
                alert("Log entry " + timestamp + " deleted");
            },
            error: function (response) {
                alert("Could not delete " + timestamp + ". " + response.responseText);
            }
        });
    }
}

function getUsers() {
    $.ajax({
        url: '/api/admin/users',
        type: 'GET',
        success: function (response) {
            var result = "";
            for (var i = 0; i < response.length; i++) {
                (function (i) {
                    if (response[i].username === "system" || response[i].username === "wemo") {
                        result += "<tr><td>" + response[i].username + "</td><td>" + response[i].real_name + "</td><td>" + response[i].access_level + "</td><td><button type='button' class='btn btn-primary' disabled>Edit</button> <button type='button' class='btn btn-danger' disabled>Delete</button></td></tr>"
                    } else {
                        result += "<tr><td>" + response[i].username + "</td><td>" + response[i].real_name + "</td><td>" + response[i].access_level + "</td><td><button onclick='editUser(\"" + response[i].username + "\",\"" + response[i].real_name + "\",\"" + response[i].access_level + "\")' type='button' class='btn btn-primary'>Edit</button> <button onclick='deleteUser(\"" + response[i].username + "\")' type='button' class='btn btn-danger'>Delete</button></td></tr>"
                    }
                })(i);
            }
            $("#logbody").html(result);
        },
        error: function (response) {
            $("#logbody").html("<tr><td>Error</td><td>Error</td><td>Error</td><td>Error</td></tr>");
            alert("Cannot retrieve users - " + JSON.parse(response.responseText).details);
        }
    });
}

function deleteUser(username) {
    if (confirm("You're about to delete " + username + ". This cannot be undone and will be logged! Do you want to proceed?")) {
        $.ajax({
            url: '/api/admin/users?username=' + username,
            type: 'DELETE',
            success: function () {
                getUsers();
                alert("User " + username + " deleted");
            },
            error: function (response) {
                alert("Could not delete " + username + ". " + response.responseText);
            }
        });
    }
}

function editUser(username, realname, accesslevel) {
    window.location.href = "addUser.html#username=" + username + "&fullname=" + realname + "&accesslevel=" + accesslevel;
}

function submitUser() {
    var username = $('#username').val();
    var password = $('#password').val();
    var realname = $('#fullname').val();
    var accesslevel = $('#accesslevel').val();

    console.log(JSON.stringify({username: username, password: password, realName: realname, accessLevel: accesslevel}));
    $.ajax({
        url: '/api/admin/users',
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({username: username, password: password, realName: realname, accessLevel: accesslevel}),
        success: function () {
            alert("User " + username + " added/changed");
            window.location.href = "users.html";
        },
        error: function (response) {
            alert("Could not add " + username + ". " + response.responseText);
        }
    });
}

function pullLatestVersion() {
    $('#gitpull').prop('disabled', true);
    if (confirm("About to download latest server. This may take a while. The server will reboot afterwards. Do you want to proceed?")) {
        $.ajax({
            url: '/api/admin/update',
            type: 'GET',
            success: function (response) {
                $('#gitpull').prop('disabled', false);
                alert(response.log);
                alert("System is restarting. This will take several minutes");
            },
            error: function (response) {
                $('#gitpull').prop('disabled', false);
                alert("error" + response.responseText);
            }
        });
    }
}
