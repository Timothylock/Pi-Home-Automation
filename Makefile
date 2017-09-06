test :
	if [ -f ./data/home_monitor.db ]; \
	then mv ./data/home_monitor.db ./data/home_monitor.db.backup; \
	fi;
	python ./tests/generateTestDB.py;
	nyc --reporter=html --reporter=text -x "**/tests/**" mocha tests --recursive;
	rm -f ./data/home_monitor.db;
	if [ -f ./data/home_monitor.db.backup ]; \
	then mv ./data/home_monitor.db.backup ./data/home_monitor.db; \
	fi;
