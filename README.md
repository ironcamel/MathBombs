
# About

MathBombs is a web application for teachers and students of math.
It is hosted at https://mathbombs.org. You may also install and deploy
your own private instance of MathBombs.
It is a javascript single page application (SPA) built with Express
for the back end REST API and React for the front end.

# Installation

To install your own instance of MathBombs, first download the latest source.
and cd to root folder of the project. Then run the following commands:

    npm i # Installs the back end API dependencies
    sqlite3 data/math.db < data/make-db.sql # Creates the database
    cd react-ui
    npm i # Installs the front end dependencies

Rename config.example.js to config.js and update it accordingly.

# Deployment

    npm start

Then you can visit http://localhost:3000 and MathBombs should be running.

