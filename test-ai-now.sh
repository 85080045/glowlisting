#!/bin/bash

# 使用提供的 Render URL 测试 AI Bot
API_URL="https://glowlisting.onrender.com/api"

echo "🧪 AI Bot 测试"
echo "📡 API URL: $API_URL"
echo ""

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 需要管理员 Token"
  echo ""
  echo "获取方法:"
  echo "1. 在浏览器中登录管理员账号"
  echo "2. 打开控制台 (F12)"
  echo "3. 运行: localStorage.getItem('glowlisting_token')"
  echo "4. 复制返回的token"
  echo ""
  echo "然后运行:"
  echo "  ADMIN_TOKEN=your_token ./test-ai-now.sh"
  exit 1
fi

echo "🔑 Token: ${ADMIN_TOKEN:0:20}..."
echo ""
echo "⏳ 正在测试..."
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
    echo ""
    echo "✅ AI Bot 工作正常!"
  fi
else
  echo "❌ 测试失败!"
  echo ""
  echo "📋 错误响应:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  
  if [ "$HTTP_CODE" -eq 401 ]; then
    echo "💡 Token 可能无效或已过期，请重新登录获取新token"
  elif [ "$HTTP_CODE" -eq 403 ]; then
    echo "💡 当前账号可能不是管理员"
  elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "💡 API 端点不存在，请检查 URL 是否正确"
  fi
fi

