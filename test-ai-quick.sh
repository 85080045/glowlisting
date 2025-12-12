#!/bin/bash

# 快速测试 AI Bot
# 使用方法: ./test-ai-quick.sh <API_URL> <ADMIN_TOKEN>
# 例如: ./test-ai-quick.sh https://your-app.onrender.com/api eyJhbGc...

if [ $# -lt 2 ]; then
  echo "❌ 使用方法: $0 <API_URL> <ADMIN_TOKEN>"
  echo ""
  echo "示例:"
  echo "  $0 https://your-app.onrender.com/api eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  echo ""
  echo "获取 Token 的方法:"
  echo "  1. 在浏览器中登录管理员账号"
  echo "  2. 打开控制台 (F12)"
  echo "  3. 运行: localStorage.getItem('glowlisting_token')"
  exit 1
fi

API_URL=$1
ADMIN_TOKEN=$2

# 确保 API_URL 以 /api 结尾
if [[ ! "$API_URL" == */api ]]; then
  API_URL="${API_URL%/}/api"
fi

echo "🧪 测试 AI Bot..."
echo "📡 API URL: $API_URL"
echo "🔑 Token: ${ADMIN_TOKEN:0:20}..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/admin/test-ai-bot" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，我想了解如何使用这个服务"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 HTTP 状态码: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ 测试成功!"
  echo ""
  echo "📋 响应:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  
  REPLY=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('reply', ''))" 2>/dev/null)
  if [ ! -z "$REPLY" ]; then
    echo "🤖 AI Bot 回复:"
    echo "──────────────────────────────────────────────────"
    echo "$REPLY"
    echo "──────────────────────────────────────────────────"
  fi
else
  echo "❌ 测试失败!"
  echo ""
  echo "📋 错误响应:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

