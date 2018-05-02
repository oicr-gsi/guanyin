Guanyin or Guan Yin is an East Asian bodhisattva associated with compassion as venerated by Mahayana Buddhists. She is commonly known as the "Goddess of Mercy" in English. The Chinese name Guanyin is short for Guanshiyin, meaning "[The 
One Who] Perceives the Sounds of the World". (from https://en.wikipedia.org/wiki/Guanyin)

# Getting started

## Requirements

    Node v4.x or higher  (developed on 8.9.1)
    NPM (comes with Node)
    PostgreSQL 9.5 or higher (developed on 10.1)

Checking for node:

    node -v


## Installing modules

    $ npm install

### Linking Flyway after `npm install`
Flyway is used here as a library rahter than as a package. It needs to be re-symlinked after `npm install`, using the following:
```
$ rm node_modules/.bin/flyway
$ cd node_modules/.bin && ln -s ../flyway/lib/flyway-5.0.7/flyway flyway && cd -
```
Note: **Do not use `npm ci`** on this project, as it will remove the Flyway library from `node_modules`.

## Postgres setup

### Setting environment variables

Create a .env file and populate it. The .env-example file provides a template for this.

### Create a PostgreSQL database

    $ psql postgres -U postgres

    # create database ${DATABASE};

    # create user ${USER};

    # alter role ${USER} with password '${PASSWORD}';

    # grant all on database ${DATABASE} to ${USER};

    # \q


### Migrating the database

When setting up the database for the first time:

    Create a file in conf/ called flyway.conf. The conf/example-flyway.conf file provides a template for this.
    
    Perform the initial migration using the following:
        $ npm run fw:clean
        $ npm run fw:migrate
        
After that initial setup, run migrations as necessary using:

	$ npm run fw:migrate

## Running the application

	$ npm run start

## Running the test

       $ npm run test
