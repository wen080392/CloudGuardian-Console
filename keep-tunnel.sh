#!/bin/bash
while true; do
  echo "Starting localtunnel..."
  npx localtunnel --port 3000 --subdomain cgwebhook1234
  sleep 2
done
