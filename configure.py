import json

conf = {"doorSensor":20,"pirSensor":16,"blinds":{"open":19,"close":26},"outletlights":{"Bedroom Lights":27,"Hallway Floor Lights":18,"Living Room Lights":17,"Living Room Outlets":22}}

with open('data/configuration.json', 'w') as outfile:
    json.dump(conf, outfile)