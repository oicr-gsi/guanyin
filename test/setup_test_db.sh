#!/bin/bash

# source the .env file from the test folder
# source might be necessary depending on system
set -a; . "$(pwd)/test/.env";  source "$(pwd)/test/.env"; set +a

# since we need to mount all the migrations in a single directory, the "regular" migrations need to be
# copied into the test folder, then deleted after.
cp sql/V*.sql test/sql/


# create flyway.conf file
echo "flyway.url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" > test/flyway.conf
echo "flyway.user=${DB_USER}" >> test/flyway.conf
echo "flyway.password=${DB_PW}" >> test/flyway.conf
echo "flyway.cleanDisabled=false" >> test/flyway.conf

# stop and remove any previously-running test containers
docker stop "${PG_DB_CONTAINER_NAME}" || true  # it's fine if the container isn't running
docker rm "${PG_DB_CONTAINER_NAME}"

# set up the Postgres database
docker run --name "${PG_DB_CONTAINER_NAME}" -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=$DB_PW -e POSTGRES_DB=$DB_NAME -d -p $DB_PORT:5432 postgres:15

# give docker time to setup the container before connecting
sleep 1

# perform cleaning and database migration
docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/sql:/flyway/sql --network=host flyway/flyway clean && \
docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host flyway/flyway migrate

find test/sql/ -type f ! -name 'V999*.sql' -delete
