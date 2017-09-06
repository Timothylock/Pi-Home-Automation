CREATE TABLE Users (
	username text PRIMARY KEY,
	password text NOT NULL,
	real_name text,
	access_level integer(1)
);

CREATE TABLE Log (
	timestamp datetime DEFAULT (datetime('now','localtime')),
	username text NOT NULL,
	type text NOT NULL,
	details text,
	origin text
);

INSERT INTO Users (username, password, real_name, access_level) VALUES ("system", "67677B42ABD63BB32F96AB6EF190D31423B491CD", "System user", 1);
INSERT INTO Users (username, password, real_name, access_level) VALUES ("wemo", "67677B42ABD63BB32F96AB6EF190D31423B491CD", "Wemo Emulation", 1);
