import urllib2, urllib, json

baseurl = "https://query.yahooapis.com/v1/public/yql?"
# For fahrenheit, remove u='c'
# To change your city, change the woeid
yql_query = "select item.condition from weather.forecast where woeid = 4118 and u='c'"

def getTemp():
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    # You can change the C at the end
    return (str(data['query']['results']['channel']['item']['condition']['temp'] + "C"))

def getCondition():
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    # You can change the C at the end
    return (str(data['query']['results']['channel']['item']['condition']['text']))

def getData():
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    # You can change the C at the end
    return (data)

