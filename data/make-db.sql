create table user (
    id TEXT primary key,
    name TEXT
);

create table sheet (
    id INT,
    user_id TEXT,
    PRIMARY KEY (id, user_id),
    FOREIGN KEY (user_id) REFERENCES user (id)
);

create table problem (
    id INT NOT NULL,
    sheet_id INT NOT NULL,
    user_id TEXT NOT NULL,
    json TEXT,
    guess TEXT,
    PRIMARY KEY (id, sheet_id, user_id),
    FOREIGN KEY (sheet_id) REFERENCES sheet (id),
    FOREIGN KEY (user_id) REFERENCES user (id)
);

insert into user values ('leila', 'Leila');
insert into user values ('ava', 'Ava');

--insert into sheet (id, user_id) values (1, 'leila');
--insert into sheet (id, user_id) values (1, 'ava');
