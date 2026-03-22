#!/bin/bash
set -e

# ============================================================
# MES Pangan Masa Depan — Container Entrypoint
# ============================================================
# Initializes PostgreSQL, runs migrations, starts supervisord
# ============================================================

echo "============================================"
echo "  MES Pangan Masa Depan — Starting..."
echo "============================================"

# ---- Color helpers ----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- PostgreSQL Configuration ----
PG_DATA="/var/lib/postgresql/16/main"
PG_CONF="/etc/postgresql/16/main"
PG_BIN="/usr/lib/postgresql/16/bin"

DB_USER="${DB_USER:-mes_user}"
DB_PASSWORD="${DB_PASSWORD:-mes_password}"
DB_NAME="${DB_NAME:-mes_pangan}"

# ---- Fix PostgreSQL directory permissions ----
log_info "Setting up PostgreSQL directories..."
mkdir -p "$PG_DATA" /run/postgresql /var/log/postgresql
chown -R postgres:postgres "$PG_DATA" /run/postgresql /var/log/postgresql
chmod 700 "$PG_DATA"

# ---- Initialize PostgreSQL if needed ----
if [ ! -f "$PG_DATA/PG_VERSION" ]; then
    log_info "Initializing PostgreSQL database cluster..."
    gosu postgres "$PG_BIN/initdb" -D "$PG_DATA" --encoding=UTF8 --locale=en_US.UTF-8

    # Start PostgreSQL temporarily to create user and database
    log_info "Starting PostgreSQL for initial setup..."
    gosu postgres "$PG_BIN/pg_ctl" -D "$PG_DATA" -w start

    log_info "Creating database user: $DB_USER"
    gosu postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;"

    log_info "Creating database: $DB_NAME"
    gosu postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    # Grant privileges
    gosu postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    gosu postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

    log_info "PostgreSQL initial setup complete!"

    # Stop temporary PostgreSQL (supervisord will start it properly)
    gosu postgres "$PG_BIN/pg_ctl" -D "$PG_DATA" -w stop
else
    log_info "PostgreSQL data directory already exists, skipping init."
fi

# ---- Always ensure pg_hba.conf and postgresql.conf exist ----
log_info "Ensuring PostgreSQL config files..."
cat > "$PG_DATA/pg_hba.conf" << 'PGEOF'
# TYPE  DATABASE    USER        ADDRESS     METHOD
local   all         all                     trust
host    all         all         127.0.0.1/32 md5
host    all         all         ::1/128      md5
PGEOF

cat > "$PG_DATA/postgresql.conf" << 'PGEOF'
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 128MB
dynamic_shared_memory_type = posix
log_timezone = 'Asia/Jakarta'
datestyle = 'iso, mdy'
timezone = 'Asia/Jakarta'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.english'
PGEOF

chown postgres:postgres "$PG_DATA/pg_hba.conf" "$PG_DATA/postgresql.conf"

# ---- Update DATABASE_URL with actual credentials ----
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# ---- Run Prisma Migrations ----
log_info "Starting PostgreSQL for migrations..."
gosu postgres "$PG_BIN/pg_ctl" -D "$PG_DATA" -w start

log_info "Running Prisma migrations..."
cd /app
npx prisma migrate deploy 2>&1 || {
    log_warn "Migration deploy failed, trying db push (safe mode)..."
    npx prisma db push 2>&1 || {
        log_error "Database schema sync failed!"
    }
}

log_info "Database setup complete!"

# Stop PostgreSQL (supervisord will restart it)
gosu postgres "$PG_BIN/pg_ctl" -D "$PG_DATA" -w stop

# ---- Remove default nginx site ----
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# ---- Start all services via Supervisord ----
echo ""
echo "============================================"
echo "  All services starting via supervisord..."
echo "============================================"
echo "  Frontend : http://localhost (port 80)"
echo "  Backend  : http://localhost:3000 (internal)"
echo "  Database : localhost:5432 (internal)"
echo "  ML Svc   : http://localhost:8000 (internal)"
echo "============================================"
echo ""

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/mes-pangan.conf
