CREATE TABLE "powerup" (
    id      INT NOT NULL,
    student VARCHAR(100) NOT NULL,
    cnt     NOT NULL DEFAULT 0,
    PRIMARY KEY (id, student),
    FOREIGN KEY (student) REFERENCES student (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "problem" (
    id        INT NOT NULL,
    sheet     INT NOT NULL,
    student   VARCHAR(100)  NOT NULL,
    question  VARCHAR(1000) NOT NULL,
    answer    VARCHAR(100)  NOT NULL,
    guess     VARCHAR(100),
    is_solved INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id, sheet, student),
    FOREIGN KEY (sheet, student) REFERENCES sheet (id, student)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "sheet" (
    id INT,
    student VARCHAR(100) NOT NULL,
    finished DATE,
    PRIMARY KEY (id, student),
    FOREIGN KEY (student) REFERENCES student (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE student (
    id         VARCHAR(100) PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    last_sheet INT NOT NULL DEFAULT 0,
    teacher_id INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teacher (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE teacher (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    VARCHAR(100) NOT NULL,
    email   VARCHAR(100) NOT NULL UNIQUE,
    pw_hash TEXT
);

