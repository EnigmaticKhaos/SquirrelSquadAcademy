#!/bin/bash
# Test script to check Judge0 connectivity

JUDGE0_URL="http://18.210.22.226:2358"
echo "Testing Judge0 at: $JUDGE0_URL"
echo ""

# Test 1: Check if port is open
echo "1. Testing if port 2358 is reachable..."
nc -zv 18.210.22.226 2358 2>&1 || echo "Port test failed (nc might not be installed, that's okay)"
echo ""

# Test 2: Try HTTP connection
echo "2. Testing HTTP connection to /submissions endpoint..."
HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$JUDGE0_URL/submissions" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71,"stdin":""}' \
  --max-time 10)

HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n1)

echo "HTTP Status: $HTTP_CODE"
echo "Response: $HTTP_BODY"
echo ""

# Test 3: Try HTTPS connection
echo "3. Testing HTTPS connection..."
HTTPS_URL="https://18.210.22.226:2358"
HTTPS_RESPONSE=$(curl -s -w "\n%{http_code}" -k -X POST "$HTTPS_URL/submissions" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71,"stdin":""}' \
  --max-time 10 2>&1)

HTTPS_BODY=$(echo "$HTTPS_RESPONSE" | sed '$d')
HTTPS_CODE=$(echo "$HTTPS_RESPONSE" | tail -n1)

echo "HTTPS Status: $HTTPS_CODE"
echo "Response: $HTTPS_BODY"
echo ""

# Summary
echo "=== SUMMARY ==="
if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
  echo "✅ HTTP works! Use: http://18.210.22.226:2358"
elif [[ "$HTTPS_CODE" == "200" ]] || [[ "$HTTPS_CODE" == "201" ]]; then
  echo "✅ HTTPS works! Use: https://18.210.22.226:2358"
else
  echo "❌ Connection failed. Check:"
  echo "   - EC2 Security Group allows port 2358"
  echo "   - Judge0 is listening on 0.0.0.0 (not just 127.0.0.1)"
  echo "   - No firewall blocking the port"
fi

