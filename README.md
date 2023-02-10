Guanyin or Guan Yin is an East Asian bodhisattva associated with compassion as venerated by Mahayana Buddhists. She is commonly known as the "Goddess of Mercy" in English. The Chinese name Guanyin is short for Guanshiyin, meaning "[The 
One Who] Perceives the Sounds of the World". (from https://en.wikipedia.org/wiki/Guanyin)

# Getting started

## Requirements

    Node v14.x or higher (recommended Node v18)
    NPM (comes with Node)
    PostgreSQL 10 or higher (developed on 10.1)
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

    $ docker pull flyway/flyway
    
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

### Testing
Pull docker images for postgres and flyway

    $ docker pull postgres:15
    $ docker pull flyway/flyway

Run tests using:

    $ npm run test
    
To wipe clean and reset the docker container for the test database without running the tests use:

    $ npm run pretest

## Building and Running using Docker
A container can be built using Docker. You will need an additional container
running PostgreSQL.

    docker build --target flyway-migration -t "oicrgsi/guanyin-flyway:${version}" .
    docker build --target webapp -t "oicrgsi/guanyin:${version}" .

To run, different environment variables are needed for each container. For the
migration container, set the [Flyway environment
variables](https://flywaydb.org/documentation/envvars) to connect to your
database. For the webapp container, set `DB_CONNECTION` to point to the
PostgreSQL database.

     docker run -e FLYWAY_USER=reportdb -e FLYWAY_PASSWORD=secret FLYWAY_URL=jdbc:postgresql://localhost/reportdb -t oicrgsi/guanyin-flyway:${version}
     docker run -p 3000:3000 -e DB_CONNECTION=postgresql://reportdb:secret @localhost/reportdb -t oicrgsi/guanyin:${version}
