#!/usr/bin/env bash
# /usr/local/bin/redeploy-parents-day.sh — sudo로 실행됨
# 배포 스크립트가 /tmp/app.jar 와 /tmp/dist-parents-day/ 를 올려놓은 후 호출
set -euo pipefail

SERVICE=parents-day
APP_PATH=/opt/parents-day/app.jar
WEB_ROOT=/var/www/im-hansub

echo "[redeploy] stop $SERVICE"
systemctl stop "$SERVICE" || true

echo "[redeploy] swap jar"
install -o parents-day -g parents-day -m 0644 /tmp/app.jar "$APP_PATH"

echo "[redeploy] swap web root"
rm -rf "${WEB_ROOT:?}"/*
mv /tmp/dist-parents-day/* "$WEB_ROOT"/
chown -R www-data:www-data "$WEB_ROOT"

echo "[redeploy] start $SERVICE"
systemctl start "$SERVICE"
systemctl status "$SERVICE" --no-pager
