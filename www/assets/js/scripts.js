function updateStatus() {
    $.ajax({
        url: '/api/status',
        type: 'GET',
        success: function (response) {
            var door = response["door"];
            var motion = response["motion"];
            var blinds = response["blinds"];
            var lightson = response["lightsOn"];

            // Status bar should start with green and change if any error
            $("#statusbar").css("color", 'green');
            $("#statusbar").html("System Normal");
            $(".leftsidebar").css("background", "linear-gradient(#0981ba, #0d5586)");

            // Color the labels accordingly
            if (door == 0) {
                $(".module_door").css("background-color", '#2ecc71');
                $("#doorOpenClose").html("CLOSED");
            } else {
                $(".module_door").css("background-color", '#f1c40f');
                $(".statusbar").css("color", '#f1c40f');
                $("#statusbar").html("Door is OPENED");
                $(".leftsidebar").css("background", "linear-gradient(#ffa500, #d88c00)");
                $("#doorOpenClose").html("OPENED");
            }

            /*if (motion == 0){
             $("#motion").css("background-color", 'ForestGreen');
             }else{
             $("#motion").css("background-color", 'orange');
             }*/

            $("#numLightsOn").html(lightson);
            if (parseInt(lightson) == 0) {
                $(".module_lights").css("background-color", '#2ecc71');
            } else {
                $(".module_lights").css("background-color", '#f1c40f');
            }

            if (blinds == 1) {
                $(".module_blinds").css("background-color", '#2ecc71');
                $(".module_blinds").attr('onclick', 'toggleBlinds(0);');
                $("#blindsOpenClose").html("CLOSED");
            } else {
                $(".module_blinds").css("background-color", '#f1c40f');
                $(".module_blinds").attr('onclick', 'toggleBlinds(1);');
                $("#blindsOpenClose").html("OPENED");
            }
        },
        error: function (response) {
            $("#statusbar").css("color", 'red');
            $("#statusbar").html("Warning - No connection");
            $(".leftsidebar").css("background", "linear-gradient(#ff4b4b, #ff1c1c)");

            $(".module_door").css("background-color", '#e74c3c');
            $(".module_blinds").css("background-color", '#e74c3c');
            $(".module_lights").css("background-color", '#e74c3c');

            $("#numLightsOn").html("N/A");
            $("#blindsOpenClose").html("N/A");
            $("#doorOpenClose").html("N/A");

            if (JSON.parse(response.responseText).code === 1007) {
                clearInterval(statusInterval);
                $("#statusbar").html("NOTICE - Account Disabled");
                $(".module_door").css("background-color", '#7f8c8d');
                $(".module_blinds").css("background-color", '#7f8c8d');
                $(".module_lights").css("background-color", '#7f8c8d');
                //$(".module_history").css("background-color", '#7f8c8d');
                $(".module_settings").css("background-color", '#7f8c8d');
                $(".module_admin").css("background-color", '#7f8c8d');
                $("#statusbar").css("color", '#7f8c8d');
                $(".leftsidebar").css("background", "#7f8c8d");
                alert(JSON.parse(response.responseText).details);
            }
        }
    });
}

function updateClock() {
    var now = new Date(), // current date
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ampm;

    // a cleaner way than string concatenation
    var date = [months[now.getMonth()], now.getDate()].join(' ');

    // Update date and time elements
    $('#date').html(date);
    $('#time').html(strTime);
}

function getWeather() {
    $.simpleWeather({
        location: 'Toronto, ON',
        unit: 'c',
        success: function (weather) {
            $("#weather_degrees").html(weather.temp + '&deg;' + weather.units.temp);
            $("#weather_condition").html(weather.currently);
            $("#weather_lowhigh").html('Low: ' + weather.low + ' High: ' + weather.high);
        },
        error: function (error) {
            $("#weather_degrees").html('N/A');
            $("#weather_condition").html("Weather Unavailable");
            $("#weather_lowhigh").html('Low: N/A High: N/A');
        }
    });
}

// Sends a POST request to toggle blinds
function toggleBlinds(to) {
    $.ajax({
        url: '/api/blinds?set=' + to,
        type: 'POST',
        success: function (response) {
            $.notify({
                title: '<strong>Success</strong>',
                icon: 'glyphicon glyphicon-check',
                message: ''
            }, {
                type: 'success',
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                },
                placement: {
                    from: "top",
                    align: "left"
                },
                delay: 1500,
                offset: 20,
                spacing: 10,
                z_index: 1031
            });
        },
        error: function (response) {
            $.notify({
                title: '<strong>Failure </strong>',
                icon: 'glyphicon glyphicon-warning-sign',
                message: JSON.parse(response.responseText).details
            }, {
                type: 'danger',
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                },
                placement: {
                    from: "top",
                    align: "left"
                },
                delay: 4000,
                offset: 20,
                spacing: 10,
                z_index: 1031
            });
        }
    });
}

// Sends a POST request to toggle lights
function toggleLight(id, to, refreshView) {
    $.ajax({
        url: '/api/lights?id=' + id + '&onoff=' + to,
        type: 'POST',
        success: function (response) {
            $.notify({
                title: '<strong>Success</strong>',
                icon: 'glyphicon glyphicon-check',
                message: ''
            }, {
                type: 'success',
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                },
                placement: {
                    from: "top",
                    align: "left"
                },
                delay: 1500,
                offset: 20,
                spacing: 10,
                z_index: 1031
            });

            if (refreshView) {
                togglelightview();
            }
        },
        error: function (response) {
            $.notify({
                title: '<strong>Failure </strong>',
                icon: 'glyphicon glyphicon-warning-sign',
                message: JSON.parse(response.responseText).details
            }, {
                type: 'danger',
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                },
                placement: {
                    from: "top",
                    align: "left"
                },
                delay: 4000,
                offset: 20,
                spacing: 10,
                z_index: 1031
            });

            if (refreshView) {
                togglelightview();
            }
        }
    });
}

// Sends a POST request to shutdown/reboot the system
function shutdownReboot(op) {
    if (confirm('Do you really want to ' + op + ' the server? This event will be logged!')) {
        var pw = window.prompt("This is a privileged action. Please enter administrator secret.", "");

        $.ajax({
            url: '/api/admin/shutdown?op=' + op + '&pw=' + pw,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(Cookies.get('username') + ":" + Cookies.get('password')));
            },
            success: function (response) {
                if (op == "reboot") {
                    alert('The server is now restarting. Please wait a few minutes.');
                } else if (op == "shutdown") {
                    alert('The server is shutting down');
                }
            },
            error: function (response) {
                alert('Operation failed! ' + response.status);
            }
        });
    }
}

function loadingModal() {
    $("#modal_title").text("Loading");
    $("#modal_content").html("Please wait...");
    if (!(($("#myModal").data('bs.modal') || {}).isShown)) {
        $("#myModal").modal('show');
    }
}

// Toggles the settings modal
function toggleSettings() {
    loadingModal();

    var insert = "<h5 class='text-center'>Basic Settings</h5>";

    insert += "<ul style='width:90%; list-style-type:none;'>";
    insert += "<li class='list-group-item' onclick='backToOldUI()'>Change back to old UI</li>";
    insert += "</ul>";

    insert += "<h5 class='text-center'>Admin Settings</h5>";

    insert += "<ul style='width:90%; list-style-type:none;'>";
    insert += "<li class='list-group-item' onclick='window.location.href = \"/admin\";'>Admin Panel</li>";
    insert += "</ul>";

    insert += "<h5 class='text-center'>User Account</h5>";

    insert += "<ul style='width:90%; list-style-type:none;'>";
    insert += "<li class='list-group-item list-group-item-danger' onclick='logout()'>Logout</li>";
    insert += "</ul>";

    $("#modal_title").text("Settings");
    $("#modal_content").html(insert);
}

// Modifies the modal for light control and shows it
function togglelightview() {
    loadingModal();

    // Get lights / statuses and update modal
    $.ajax({
        url: '/api/lights',
        type: 'GET',
        success: function (response) {
            var insert = "<ul style='width:90%; list-style-type:none;'>";
            for (var i = 0; i < response["lights"].length; i++) {
                if (response["lights"][i]["status"] == "on") {
                    insert += "<li class='list-group-item' style='background-color:#2ecc71;' onclick='toggleLight(\"" + response["lights"][i]["id"] + "\",\"off\", true)'>" + response["lights"][i]["name"] + "</li>";
                } else {
                    insert += "<li class='list-group-item' style='background-color:#e74c3c;' onclick='toggleLight(\"" + response["lights"][i]["id"] + "\",\"on\", true)'>" + response["lights"][i]["name"] + "</li>";
                }

            }
            insert += "</ul>";

            $("#modal_title").text("Light Control");
            $("#modal_content").html(insert);
        },
        error: function (response) {
            $("#modal_title").text("Error");
            $("#modal_content").html("The server was unable to load the lights. Is there a connection to the server?");
            $("#modal_footer").html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
        }
    });
}

// Modifies the modal for seeing logs
function togglehistoryview() {
    loadingModal();

    // Get lights / statuses and update modal
    $.ajax({
        url: '/api/log',
        type: 'GET',
        success: function (response) {
            var insert = "<ul class='list-group'>";
            for (var i = response.length - 1; i >= 0; i--) {
                var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                d.setUTCSeconds(response[i].substring(0, response[i].length - 4) / 1000);
                insert += "<li class='list-group-item' onclick='showPicture(\"" + response[i] + "\",\"" + d + "\");'>" + d + "</li>";
            }

            insert += "</ul>";

            $("#modal_title").text("Last 10 History");
            $("#modal_content").html(insert);
            $("#modal_footer").html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
        },
        error: function (response) {
            $("#modal_title").text("Error");
            $("#modal_content").html("The server was unable to load the history. Is there a connection to the server?");
            $("#modal_footer").html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
        }
    });
}

// Shows the picture in picModal
function showPicture(filename, date) {
    $("#pic_modal_title").text(date + "  (" + filename + ")");
    $("#pic_modal_content").html("<img style='width: 100%' src='/logs/" + filename + "'>");
    $("#pic_modal_footer").html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
    $("#picModal").modal('show');
}

// Logs the user out
function logout() {
    if (confirm('Do you want to log out?')) {
        $.ajax({
            type: "GET",
            url: "/api/status",
            async: false,
            username: "logout",
            password: "invalidpss",
            headers: {"Authorization": "Basic"}
        })
        .done(function(){
            alert("Could not log out!");
        })
        .fail(function(){
            // We expect to get an 401 Unauthorized error! In this case we are successfully 
                // logged out and we redirect the user.
            location.reload();
        });
    }
}

// Adds a cookie to switch back to old UI
function backToOldUI() {
    if (confirm('Do you want to switch back to the old UI? While it will still work in the foreseeable future, no new features will be added to it.')) {
        Cookies.set('beta', "False", {expires: 365});
        window.location.replace("/legacy");
    }
}

/////////////
// Run these when the script first loads
/////////////

// Send the user to the old UI
if (Cookies.get('beta') == 'False') {
    window.location.replace("/legacy");
}

setInterval(updateClock, 1000);
setInterval(getWeather, 600000);
var statusInterval = setInterval(updateStatus, 750);
