#!/bin/sh
set -e

if [ -d /data ]; then
  chown -R nextjs:nodejs /data
fi

exec node server.js
