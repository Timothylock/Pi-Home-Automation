function getWeather() {
  $.simpleWeather({
    location: 'Toronto, ON',
    unit: 'c',
    success: function(weather) {      
      //html = '<img src="'+weather.image+'">';
      html = '<h2 style="font-size: 4vw; text-align: left; margin-left: 20px; margin-top: 100px;">'+weather.temp+'&deg;'+weather.units.temp+'</h2>';
      html += '<h2 style="font-size: 2vw; text-align: left; margin-left: 20px; line-height: 35%">'+weather.currently+'</h2>';
      html += '<h2 style="font-size: 2vw; text-align: left; margin-left: 20px; line-height: 160%"> Low: '+weather.low+' High: '+weather.high+'</h2>';
      $("#weather").html(html);
    },
    error: function(error) {
      html = '<h2 style="font-size: 4vw; text-align: left; margin-left: 20px; margin-top: 100px;">N/A</h2>';
      html += '<h2 style="font-size: 2vw; text-align: left; margin-left: 20px; line-height: 35%">Cannot fetch weather</h2>';
      html += '<h2 style="font-size: 2vw; text-align: left; margin-left: 20px; line-height: 160%"> Low: N/A High: N/A</h2>';
      $("#weather").html(html);
    }
  });

  setTimeout(getWeather, 600000); //Update the weather every 10 minutes.
}
