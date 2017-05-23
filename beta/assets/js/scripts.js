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
    var date = [months[now.getMonth()], now.getDate()].join(' ');

    // Update date and time elements
    $('#date').html(date);
    $('#time').html(strTime);
}

function getWeather() {
    $.simpleWeather({
        location: 'Toronto, ON',
        unit: 'c',
        success: function(weather) {
            $("#weather_degrees").html(weather.temp + '&deg;' + weather.units.temp);
            $("#weather_condition").html(weather.currently);
            $("#weather_lowhigh").html('Low: ' + weather.low + ' High: ' + weather.high);
        },
        error: function(error) {
            $("#weather_degrees").html('N/A');
            $("#weather_condition").html("Weather Unavailable");
            $("#weather_lowhigh").html('Low: N/A High: N/A');
        }
    });
}

setInterval(updateClock, 1000);
setInterval(getWeather, 600000);
