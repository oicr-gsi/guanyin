Guanyin or Guan Yin is an East Asian bodhisattva associated with compassion as venerated by Mahayana Buddhists. She is commonly known as the "Goddess of Mercy" in English. The Chinese name Guanyin is short for Guanshiyin, meaning "[The 
One Who] Perceives the Sounds of the World". (from https://en.wikipedia.org/wiki/Guanyin)

# Getting started

## Requirements

    Node v4.x or higher  (developed on 8.9.1)
    NPM (comes with Node)
    PostgreSQL 9.5 or higher (developed on 10.1)
    Docker (if using for database migrations)

Checking for node:

    node -v


## Installing modules

    $ npm install

## Postgres setup

### Setting environment variables

Create a `.env` file and populate it. The `.env-example` file provides a template for this.

### Create a PostgreSQL database

    $ psql postgres -U postgres

    # create database ${DATABASE};
    # create user ${USER};
    # alter role ${USER} with password '${PASSWORD}';
    # grant all on database ${DATABASE} to ${USER};
    # \q


### Migrating the database

Database migrations can be applied manually, but we like Flyway for applying migrations in a controlled way. To
use Flyway for migrations, when setting up the database for the first time:

Create a file in conf/ called `flyway.conf`. The `conf/example-flyway.conf` file provides a template for this.

Pull in the Flyway Docker image:

    $ docker pull boxfuse/flyway
    
Perform the initial migration using the following:

    $ npm run fw:migrate

After that initial setup, run migrations as necessary using the same command.

If the database needs to be wiped clean and reset, this can be done using:

    $ npm run fw:clean
    $ npm run fw:migrate

Note that the argument `--network=host` in `package.json`'s `fw:clean` and `fw:migrate` are particularly important if 
`flyway.url` includes `localhost`.

## Running the application

    $ npm run start

## Running the tests

Create a file in test/ called `flyway.conf`. The `test/example-flyway.conf` file provides a template for this. Use these
variables to create the database below.

### Create a PostgreSQL database for the tests (sadly, it's not yet containerized)

    $ psql postgres -U postgres

    # create database ${TEST_DATABASE};
    # create user ${TEST_USER};
    # alter role ${TEST_USER} with password '${TEST_PASSWORD}';
    # grant all on database ${TEST_DATABASE} to ${TEST_USER};
    # \q

### Run the tests

    $ npm test
