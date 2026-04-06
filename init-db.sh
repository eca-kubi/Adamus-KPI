#!/bin/bash
set -e

# This script is executed by the app container on startup.
# It uses environment variables so that no passwords are hardcoded in source control.

DB_HOST="${DB_HOST:-db}"
DB_NAME="${MARIADB_DATABASE:-${MYSQL_DATABASE}}"
ROOT_PASSWORD="${MARIADB_ROOT_PASSWORD:-${MYSQL_ROOT_PASSWORD}}"
APP_DB_USER="${MYSQL_USER}"
APP_DB_PASSWORD="${MYSQL_PASSWORD}"
ALEMBIC_DB_PASSWORD="${ALEMBIC_PASSWORD}"

if [ -z "${DB_NAME}" ] || [ -z "${ROOT_PASSWORD}" ] || [ -z "${APP_DB_USER}" ] || [ -z "${APP_DB_PASSWORD}" ] || [ -z "${ALEMBIC_DB_PASSWORD}" ]; then
    echo "Missing required DB initialization environment variables."
    echo "Required: MYSQL_DATABASE (or MARIADB_DATABASE), MYSQL_ROOT_PASSWORD (or MARIADB_ROOT_PASSWORD), MYSQL_USER, MYSQL_PASSWORD, ALEMBIC_PASSWORD"
    exit 1
fi

echo "Connecting to MariaDB host: ${DB_HOST} as root..."

mysql -h "${DB_HOST}" --skip-ssl -u root -p"${ROOT_PASSWORD}" <<-EOSQL
    -- 1. Create the highly-privileged Alembic user
    CREATE USER IF NOT EXISTS 'alembic_user'@'%' IDENTIFIED BY '${ALEMBIC_DB_PASSWORD}';
    GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO 'alembic_user'@'%';

    -- 2. Create the default app user to least privileges explicitly
    CREATE USER IF NOT EXISTS '${APP_DB_USER}'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
    GRANT SELECT, INSERT, UPDATE, DELETE ON ${DB_NAME}.* TO '${APP_DB_USER}'@'%';

    -- 3. Apply the changes
    FLUSH PRIVILEGES;
    
    -- 4. List all users for confirmation
    SELECT User, Host FROM mysql.user;
EOSQL

echo "✅ Database users initialized successfully. See list above."
