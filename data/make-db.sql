CREATE TABLE user (
    id VARCHAR(100) PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT,
    last_sheet INT DEFAULT 0
);
CREATE TABLE sheet (
    id INT,
    user_id varchar(100) NOT NULL,
    finished DATE,
    PRIMARY KEY (id, user_id),
    FOREIGN KEY (user_id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE problem (
    id INT NOT NULL,
    sheet_id INT NOT NULL,
    user_id varchar(100) NOT NULL,
    json TEXT,
    guess TEXT,
    PRIMARY KEY (id, sheet_id, user_id),
    FOREIGN KEY (sheet_id, user_id) REFERENCES sheet (id, user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

insert into user values ('leila', 'Leila');
insert into user values ('ava', 'Ava');
insert into user values ('arianna', 'Arianna');
insert into user values ('test', 'Test');

--insert into sheet (id, user_id) values (1, 'leila');
--insert into sheet (id, user_id) values (1, 'ava');
.schema
.schema sheet
.schema sheet
