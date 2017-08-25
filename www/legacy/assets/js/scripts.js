// Running onLoad, will check if the page is to be loaded with any specific modal, etc.
function checkArguments() {
	if(window.location.hash) {
		var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
    	if (hash == "history"){
    		togglehistoryview();
		}else if (hash == "lights"){
    		togglelightview();
		}
	}
}

function updateClock() {
	var now = new Date(), // current date
	months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var hours = now.getHours();
	var minutes = now.getMinutes();
	var ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ampm;
	
	// a cleaner way than string concatenation
	date = [months[now.getMonth()], now.getDate()].join(' ');

	// Update date and time elements
	$('#date').html("<a style='font-size: 4vw; text-align: left; line-height: 10%; padding: 8px 16px; color: #f3f3f3; text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15);'>" + date + "</a>");
	$('#time').html("<a style='font-size: 6vw; text-align: left; color: #f3f3f3; padding: 8px 16px; text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15);'>" + strTime + "</a>");
	
}

function updateStatus() {
	// 0 - no problem
	// 1 - problem
	var door = 0;
	var motion = 0;
	var power = 0;
	var server = 0;
	var ftp = 0;
	var blinds = 0;

	$.ajax({
        url: '/api/status',
		type: 'GET',
		success: function(response) {
			door = response["door"];
			motion = response["motion"];
			power = response["power"];
			ftp = response["ftp"];
			blinds = response["blinds"];

			// Status bar should start with green and change if any error
			$("#statusOverview").css("color", 'green');
			$("#statusOverview").html("<a>System Normal</a>");
			$("#mainLeft").css("background", "linear-gradient(#0981ba, #0d5586)");

			// Color the labels accordingly
			if (door == 0){
				$("#door").css("background-color", 'ForestGreen');
			}else{
				$("#door").css("background-color", 'orange');
				$("#statusOverview").css("color", 'orange');
				$("#statusOverview").html("<a>Door is open</a>");
				$("#mainLeft").css("background", "linear-gradient(#ffa500, #d88c00)");
			}

			if (motion == 0){
				$("#motion").css("background-color", 'ForestGreen');
			}else{
				$("#motion").css("background-color", 'orange');
			}

			if (server == 0){
				$("#server").css("background-color", 'green');
			}else{
				$("#statusOverview").css("color", 'red');
				$("#statusOverview").html("<a>Warning - Check Status</a>");
				$("#mainLeft").css("background", "linear-gradient(#ff4b4b, #ff1c1c)");
				$("#server").css("background-color", 'red');
			}

			if (ftp == 0){
				$("#ftp").css("background-color", 'green');
			}else{
				$("#ftp").css("background-color", 'orange');
				$("#statusOverview").css("color", 'red');
				$("#statusOverview").html("<a>Warning - Check Status</a>");
				$("#mainLeft").css("background", "linear-gradient(#ff4b4b, #ff1c1c)");
			}

			if (blinds == 0){
				$("#blinds").css("background-color", 'red');
				$("#blinds").attr('onclick', 'toggleBlinds(1)');
			}else{
				$("#blinds").css("background-color", 'ForestGreen');
				$("#blinds").attr('onclick', 'toggleBlinds(0)');
			}
		},
		error: function(response) {
			$("#statusOverview").css("color", 'red');
			$("#statusOverview").html("<a>Warning - No Connection</a>");
			$("#mainLeft").css("background", "linear-gradient(#ff4b4b, #ff1c1c)");

			$("#server").css("background-color", 'red');
			$("#ftp").css("background-color", 'red');
			$("#motion").css("background-color", 'red');
			$("#door").css("background-color", 'red');
			$("#blinds").css("background-color", 'red');

			if(response.status==401){
				togglelogin();
			}
		}
	});
}

// Modifies the modal for light control and shows it
function togglelightview(){
	loadingModal();

	// Get lights / statuses and update modal
	$.ajax({
        url: '/api/lights',
		type: 'GET',
		success: function(response) {
			var insert = "<ul style='width:90%; list-style-type:none;'>";
            for (var i = 0; i < response["lights"].length; i++) {
				if (response["lights"][i]["status"] == "on"){
					insert += "<li style='padding:20px; background-color:#2ecc71;' onclick='toggleLight(\"" + response["lights"][i]["id"] + "\",\"off\", true)'>" + response["lights"][i]["name"] + "</li>";
				}else{
					insert += "<li style='padding:20px; background-color:#e74c3c;' onclick='toggleLight(\"" + response["lights"][i]["id"] + "\",\"on\", true)'>" + response["lights"][i]["name"] + "</li>";
				}
				
			}
			insert += "</ul>";

			$("#modalTitle").text("Light Control");
			$("#modalContent").html(insert);
		},
        error: function () {
            toastr["error"]("Could not receive light data from server");
		}
	});
}

// Modifies the modal for seeing logs
function togglehistoryview(){
	loadingModal();

	// Get lights / statuses and update modal
	$.ajax({
        url: '/api/log',
		type: 'GET',
		success: function(response) {
			var insert = "<ul style='width:90%; list-style-type:none;'>";
            for (var i = response.length - 1; i >= 0; i--) {
				var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
				d.setUTCSeconds(response[i].substring(0,response[i].length - 4)/1000);
				insert += "<li style='padding:20px; background-color:#2ecc71;' onclick='showPic(\"" + response[i] + "\")'>" + d + "</li>";
			}
			insert += "</ul>";

			$("#modalTitle").text("Last 10 History");
			$("#modalContent").html(insert);
		},
        error: function () {
            toastr["error"]("Could not receive logs from server");
		}
	});
}

// Shows the picture
function showPic(name){
	$("#fname").html("<a>" + name + "</a>");
	$("#picture").html("<img style=\"width: 100%\" src=\"/logs/" + name + "\">");
	$("#pic").show();
}

// Sends a POST request to toggle lights
function toggleLight(id, to, refreshView){
	console.log("TOGGLE LIGHT");
	$.ajax({
        url: '/api/lights?id=' + id + '&onoff=' + to,
		type: 'POST',
		success: function(response) {
			toastr["success"]("Success");
			if(refreshView){
				togglelightview();
			}
		},
		error: function(response) {
            toastr["error"](JSON.parse(response.responseText).details);
			if(refreshView){
				togglelightview();
			}
		}
	});
}

// Sends a POST request to toggle blinds
function toggleBlinds(to){
	console.log("TOGGLE BLINDS");
	$.ajax({
        url: '/api/blinds?set=' + to,
		type: 'POST',
		success: function(response) {
            toastr["success"]("Success");
		},
		error: function(response) {
            toastr["error"](JSON.parse(response.responseText).details);
		}
	});
}

// Modifies the modal for login
function togglelogin(){
	// Only show if not open already
	if (!($("#myModal").is(":visible"))){
        var insert = 'The server reports that this device is unauthorized. Please login.';
		insert += '<br><br><b>Username</b><input type="text" placeholder="Enter Username" id="uname" required><br><b>Password</b><input type="password" placeholder="Enter Password" id="psw" required><br><button onclick="storeLogin();">Login</button>';
		$("#modalTitle").text("Not Authorized");
		$("#modalContent").html(insert);

		$("#myModal").show();
	}
}

// Stores the user into cookies
function storeLogin(){
	Cookies.set('username', $("#uname").val(), { expires: 365 });
	Cookies.set('password', $("#psw").val(), { expires: 365 });

	$("#myModal").hide();
}

// When the user clicks on the X, close it
$(document).on('click','.close',function(){
	$("#myModal").hide();
});

// Show a modal screen saying loading
function loadingModal(){
	$("#modalTitle").text("Please Wait");
	$("#modalContent").html("Loading...");

	$("#myModal").show();
}

setInterval(updateClock, 1000);
setInterval(updateStatus, 750);
/*
// When the user clicks anywhere outside of the modal, close it
$(document).on('click','.modal',function(){
    $("#myModal").hide();
    console.log("cls");
});*/

function newui() {
	if (confirm('Do you want to switch to the new UI? Many features are avilable there that are not in this old UI.')) {
		Cookies.set('beta', "True", { expires: 365 });
		window.location.replace("/");
	}
}

function promptBeta() {
	if (Cookies.get("beta") == "False") { // Don't bother them again if they came back from the beta
        if (confirm('The beta UI is now available! Do you want to switch to the beta ui?')) {
            Cookies.set('beta', "True", { expires: 365 });
        }
	}

	if (Cookies.get("beta") == "True") {
        window.location.replace("/");
	}
}
