#!/bin/bash
while true; do
  curl -s -o /dev/null https://cgwebhook1234.loca.lt/ping || {
    pkill -f localtunnel
    npx localtunnel --port 3000 --subdomain cgwebhook1234 > tunnel.log 2>&1 &
  }
  sleep 10
done
