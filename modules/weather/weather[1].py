import urllib2, urllib, json

baseurl = "https://query.yahooapis.com/v1/public/yql?"

def getTemp(woeid, unit):
    yql_query = "select item.condition from weather.forecast where woeid = " + woeid + " and u='" + unit + "'"
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    return (str(data['query']['results']['channel']['item']['condition']['temp'] + "C"))

def getCondition(woeid, unit):
    yql_query = "select item.condition from weather.forecast where woeid = " + woeid + " and u='" + unit + "'"
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    return (str(data['query']['results']['channel']['item']['condition']['text']))

def getData(woeid, unit):
    yql_query = "select item.condition from weather.forecast where woeid = " + woeid + " and u='" + unit + "'"
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    return (data)

print("Weather module initialized")