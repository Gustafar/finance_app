#!/bin/sh
set -e

echo "Aplicando migrations..."
./migrate -dir ./migrations

exec ./api
