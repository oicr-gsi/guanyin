Guanyin or Guan Yin is an East Asian bodhisattva associated with compassion as venerated by Mahayana Buddhists. She is commonly known as the "Goddess of Mercy" in English. The Chinese name Guanyin is short for Guanshiyin, meaning "[The 
One Who] Perceives the Sounds of the World". (from https://en.wikipedia.org/wiki/Guanyin)

# Getting started

## Tools and technologies

    Node 8.9.1
    express-generator 4.15.5
    pg-promise 7.3.2
    PostgreSQL 10.1
    flywaydb-cli 0.5.0

Checking for node:

	node -v


## Project setup

    $ npm install express-generator

    $ ./node_modules/express-generator/bin/express-cli.js guanyin

    $ npm install

    $ npm install pg-promise --save

    $ npm install bluebird --save


## Postgres setup

### Setting environment variables

Create a .env file and populate it. The .env-example file provides a template for this.

    $ npm install dotenv --save

### Create a PostgreSQL database
    $ psql postgres -U postgres

    # create database ${DATABASE};

    # create user ${USER};

    # alter role ${USER} with password '${PASSWORD}';

    # grant all on database ${DATABASE} to ${USER};

    # \q


### Migrating the database

Install flyway
		
        $ npm install flywaydb-cli --save

When setting up the database for the first time:

    Create a file in conf/ called flyway.conf. The conf/example-flyway.conf file provides a template for this.
    
    Perform the initial migration using the following:
        $ npm run fw-clean
        $ npm run fw-migrate
        


After that initial setup, run migrations as necessary using:

		$ npm run fw-migrate

## Running the application

	$ npm start

## Running the test

       $ npm run test
