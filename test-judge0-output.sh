#!/bin/bash
# Test what Judge0 returns for JavaScript console.log

echo "Testing Judge0 with JavaScript console.log..."
echo ""

curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello, World!\");",
    "language_id": 63,
    "stdin": ""
  }' \
  --max-time 30 | jq '.'

echo ""
echo "---"
echo "Testing with Python for comparison..."
echo ""

curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": ""
  }' \
  --max-time 30 | jq '.'

