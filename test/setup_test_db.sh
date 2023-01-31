#!/bin/bash

# since we need to mount all the migrations in a single directory, the "regular" migrations need to be
# copied into the test folder, then deleted after.

#cp sql/V*.sql test/sql/
#
#docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/sql:/flyway/sql --network=host boxfuse/flyway clean && \
#docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host boxfuse/flyway migrate
#
#find test/sql/ -type f ! -name 'V999*.sql' -delete

PG_DB_CONTAINER_NAME="test"  # Also used in package.json to stop the container after the test

# stop any previously-running test containers


docker stop "${PG_DB_CONTAINER_NAME}"
docker rm "${PG_DB_CONTAINER_NAME}"

cp sql/V*.sql test/sql/

sleep 1

# set up the Postgres database
# docker run -d --rm --name "${PG_DB_CONTAINER_NAME}" -p 5436:5432 -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test_report_db postgres:9.1 -c shared_buffers=500MB -c fsync=off 
docker run --name "${PG_DB_CONTAINER_NAME}" -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test_report_db -d -p 5436:5432 postgres:10

echo "sleepy"
sleep 1
echo "waking up"

#docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/sql:/flyway/sql --network=host flyway/flyway clean && \
#docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host flyway/flyway migrate

docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host flyway/flyway clean && \
		docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host flyway/flyway migrate

find test/sql/ -type f ! -name 'V9*.sql' -delete