#!/bin/env sh

set -e
sqlite3 /data/db.sqlite ".backup '/data/backup_db.sqlite'"

npm run db:up
