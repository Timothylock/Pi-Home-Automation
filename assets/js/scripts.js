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
	
	// call this function again in 1000ms
	setTimeout(updateClock, 1000);
}

function updateStatus() {
	// 0 - no problem
	// 1 - problem
	var door = 0;
	var motion = 0;
	var power = 0;
	var server = 0;
	var ftp = 0;

	$.ajax({
		url: '/status',
		type: 'GET',
		success: function(response) {
			console.log(response);
			door = response["door"];
			motion = response["motion"];
			power = response["power"];
			ftp = response["ftp"];

			// Status bar should start with green and change if any error
			$("#statusOverview").css("color", 'green');
			$("#statusOverview").html("<a>System Normal</a>");
			$("#mainLeft").css("background", "linear-gradient(#0981ba, #0d5586)");

			// Color the labels accordingly
			if (door == 0){
				$("#door").css("background-color", 'ForestGreen');
			}else{
				$("#door").css("background-color", 'orange');
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
		},
		error: function(response) {
			$("#statusOverview").css("color", 'red');
			$("#statusOverview").html("<a>Warning - No Connection</a>");
			$("#mainLeft").css("background", "linear-gradient(#ff4b4b, #ff1c1c)");

			$("#server").css("background-color", 'red');
			$("#ftp").css("background-color", 'red');
			$("#motion").css("background-color", 'red');
			$("#door").css("background-color", 'red');
		}
	});


	// call this function again in 1000ms
	setTimeout(updateStatus, 750);
}

function togglelight(){
	$("#myModal").show();
	toastr["success"]("Request Sent");
}

// When the user clicks on the X, close it
$(document).on('click','.close',function(){
	$("#myModal").hide();
});

// When the user clicks anywhere outside of the modal, close it
$(document).on('click','.modal',function(){
    $("#myModal").hide();
});