#!/bin/sh
set -e
# Railway volumes mount as root — ensure the app user can write db/uploads/backups.
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/uploads" "$DATA_DIR/backups"
chown -R nextjs:nodejs "$DATA_DIR" 2>/dev/null || true
chmod -R u+rwX "$DATA_DIR" 2>/dev/null || true
exec su-exec nextjs "$@"
