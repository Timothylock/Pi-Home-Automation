$(document).ready(function() {  
  getWeather(); //Get the initial weather.
  setInterval(getWeather, 600000); //Update the weather every 10 minutes.
});

function getWeather() {
  $.simpleWeather({
    location: 'Toronto, ON',
    unit: 'c',
    success: function(weather) {
      
      //html = '<img src="'+weather.image+'">';
      html = '<h2 style="font-size: 4vw; text-align: left; margin-left: 20px; margin-top: 100px;">'+weather.temp+'&deg;'+weather.units.temp+'</h2>';
      html += '<h2 style="font-size: 2vw; text-align: left; margin-left: 20px; line-height: 35%">'+weather.currently+'</h2>';
      console.log(weather.low);
      html += '<h2 style="font-size: 2vw; text-align: left; margin-left: 20px; line-height: 160%"> Low: '+weather.low+' High: '+weather.high+'</h2>';
      $("#weather").html(html);
    },
    error: function(error) {
      $("#weather").html('<p>'+error+'</p>');
    }
  });
}
