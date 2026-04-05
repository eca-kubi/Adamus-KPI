#!/bin/bash
set -e

# This script is executed by the app container on startup.
# It uses environment variables so that no passwords are hardcoded in source control.

echo "Connecting to MariaDB host: db as root..."

mysql -h db --skip-ssl -u root -p"${MARIADB_ROOT_PASSWORD}" <<-EOSQL
    -- 1. Create the highly-privileged Alembic user
    CREATE USER IF NOT EXISTS 'alembic_user'@'%' IDENTIFIED BY '${ALEMBIC_PASSWORD}';
    GRANT ALL PRIVILEGES ON ${MARIADB_DATABASE}.* TO 'alembic_user'@'%';

    -- 2. Create the default app user to least privileges explicitly
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
    GRANT SELECT, INSERT, UPDATE, DELETE ON ${MARIADB_DATABASE}.* TO '${MYSQL_USER}'@'%';

    -- 3. Apply the changes
    FLUSH PRIVILEGES;
    
    -- 4. List all users for confirmation
    SELECT User, Host FROM mysql.user;
EOSQL

echo "✅ Database users initialized successfully. See list above."
