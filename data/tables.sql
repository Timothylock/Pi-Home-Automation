CREATE TABLE Users (
	userid integer PRIMARY KEY AUTOINCREMENT,
	username text NOT NULL,
	password text NOT NULL,
	real_name text,
	access_level integer(1)
);

CREATE TABLE Log (
	timestamp datetime DEFAULT (datetime('now','localtime')),
	userid integer NOT NULL,
	type text NOT NULL,
	details text,
	origin text
);

INSERT INTO Users (userid, username, password, real_name, access_level) VALUES (1, "system", "67677B42ABD63BB32F96AB6EF190D31423B491CD", "System user", 0);
INSERT INTO Users (userid, username, password, real_name, access_level) VALUES (2, "wemo", "67677B42ABD63BB32F96AB6EF190D31423B491CD", "Wemo Emulation", 0);