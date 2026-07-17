#!/usr/bin/env bash
# Smoke test against a running API (default http://127.0.0.1:3000)
set -euo pipefail
BASE="${API_BASE:-http://127.0.0.1:3000}"

echo "== health =="
curl -sf "$BASE/health" | tee /tmp/egofind-health.json
echo

echo "== wechat mock login =="
LOGIN=$(curl -sf -X POST "$BASE/auth/wechat" \
  -H 'Content-Type: application/json' \
  -d '{"code":"smoke-user-1"}')
echo "$LOGIN" | tee /tmp/egofind-login.json
TOKEN=$(node -e "const j=require('/tmp/egofind-login.json'); const d=j.data||j; process.stdout.write(d.accessToken||d.data?.accessToken||'')")
if [[ -z "$TOKEN" ]]; then
  # unified interceptor wraps again? try parse
  TOKEN=$(node -e "let j=JSON.parse(require('fs').readFileSync('/tmp/egofind-login.json','utf8')); j=j.data||j; console.log(j.accessToken||'')")
fi
echo "token_len=${#TOKEN}"

echo "== admin login =="
curl -sf -X POST "$BASE/auth/admin/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}' | tee /tmp/egofind-admin.json
echo

if [[ -n "$TOKEN" ]]; then
  echo "== bind phone mock =="
  curl -sf -X POST "$BASE/users/phone/bind" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"phoneNumber":"13900001111"}'
  echo

  echo "== create driver trip =="
  START=$(node -e "const d=new Date(Date.now()+3600e3); console.log(d.toISOString())")
  END=$(node -e "const d=new Date(Date.now()+7200e3); console.log(d.toISOString())")
  curl -sf -X POST "$BASE/driver-trips" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"origin\":{\"name\":\"A\",\"lat\":38.184,\"lng\":115.201,\"adcode\":\"130128\"},\"dest\":{\"name\":\"B\",\"lat\":38.19,\"lng\":115.21,\"adcode\":\"130128\"},\"departStart\":\"$START\",\"departEnd\":\"$END\",\"seatsTotal\":3,\"priceCents\":1500}"
  echo

  echo "== map markers passenger =="
  curl -sf "$BASE/map/markers?mode=passenger&adcode=130128" \
    -H "Authorization: Bearer $TOKEN"
  echo
fi

echo
echo "smoke-api OK"
