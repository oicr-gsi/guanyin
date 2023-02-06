#!/bin/bash

. test/.env

docker stop "${PG_DB_CONTAINER_NAME}"
rm $(pwd)/test/flyway.conf
