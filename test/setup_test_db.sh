#!/bin/bash

# since we need to mount all the migrations in a single directory, the "regular" migrations need to be
# copied into the test folder, then deleted after.
cp sql/V*.sql test/sql/

docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/sql:/flyway/sql --network=host boxfuse/flyway clean && \
docker run --rm -v $(pwd)/test:/flyway/conf -v $(pwd)/test/sql:/flyway/sql --network=host boxfuse/flyway migrate

find test/sql/ -type f ! -name 'V999*.sql' -delete