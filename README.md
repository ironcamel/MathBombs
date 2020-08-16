
# About

MathSheets is a web application for teachers and students of math.
It is hosted at https://mathbombs.org. You may also install
your own private instance of MathSheets.

# Installation

To install your own instance of MathSheets, first download the latest source.

    https://github.com/ironcamel/MathSheets.git

Cd to the root of the project.

    cd MathSheets

To install the dependencies, you will need `cpanminus`.
On recent Debian based systems you can install, it via
`apt-get install cpanminus`. You may also install it straigh from CPAN,
`cpan App::cpanminus`. Once you have `cpanminus`, you can install all the
dependencies simply by running:

    cpanm --installdeps .

Rename config.example.yml to config.yml and update it accordingly. Directions
are provided inside the file. Make sure you update the database dns to point
it to a database that you wish to the database you wish to use. You may use
most popular database systems such as SQLite, PostgreSQL, MySQL,
Microsoft SQL Server, or Oracle. SQLite is a good choice if you want to make
things easy on yourself. To create the database tables, run:

    perl ./bin/create-db.pl

To deploy MathSheets, you can simply run:

    perl ./bin/app.pl

Then you can visit http://localhost:3000 and MathSheets should be running.
For production deployment options, see the documentation at
https://metacpan.org/module/Dancer::Deployment.
