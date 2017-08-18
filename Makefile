test :
	if [ -f ./data/home_monitor.db ]; \
	then mv ./data/home_monitor.db ./data/home_monitor.db.backup; \
	fi;
	cp ./tests/testing.db ./data/home_monitor.db;
	nyc --reporter=html --reporter=text mocha tests --recursive --delay;
	rm -f ./data/home_monitor.db;
	if [ -f ./data/home_monitor.db.backup ]; \
	then mv ./data/home_monitor.db.backup ./data/home_monitor.db; \
	fi;
