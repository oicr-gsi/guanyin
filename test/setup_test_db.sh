#!/bin/bash

# since we need to mount all the migrations in a single directory, the "regular" migrations need to be
# copied into the test folder, then deleted after.
cp sql/V*.sql test/sql/

PG_DB_CONTAINER_NAME="test"  # Also used in package.json to stop the container after the test

# stop and remove any previously-running test containers
docker stop "${PG_DB_CONTAINER_NAME}"
docker rm "${PG_DB_CONTAINER_NAME}"

# set up the Postgres database
docker run --name "${PG_DB_CONTAINER_NAME}" -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test_report_db -d -p 5436:5432 postgres:10

#perform cleaning and database migration
docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/sql:/flyway/sql --network=host flyway/flyway clean && \
docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host flyway/flyway migrate

find test/sql/ -type f ! -name 'V999*.sql' -delete