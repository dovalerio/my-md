#!/bin/bash
set -euo pipefail

cd /opt/md-editor
git pull
docker compose down
docker compose up -d --build
docker ps
