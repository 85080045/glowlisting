#!/bin/bash

# AI Bot 测试脚本
# 使用方法：
# 1. 在浏览器中登录管理员账号
# 2. 打开浏览器控制台，运行: localStorage.getItem('glowlisting_token')
# 3. 复制token，然后运行此脚本：
#    ADMIN_TOKEN=your_token API_URL=https://your-backend-url/api ./test-ai-bot.sh

API_URL=${API_URL:-"http://localhost:3001/api"}
ADMIN_TOKEN=${ADMIN_TOKEN}

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 ADMIN_TOKEN 环境变量"
  echo ""
  echo "获取token的方法:"
  echo "1. 在浏览器中登录管理员账号"
  echo "2. 打开浏览器控制台 (F12)"
  echo "3. 运行: localStorage.getItem('glowlisting_token')"
  echo "4. 复制token"
  echo ""
  echo "然后运行:"
  echo "  ADMIN_TOKEN=your_token API_URL=https://your-backend-url/api ./test-ai-bot.sh"
  exit 1
fi

echo "🧪 开始测试 AI Bot..."
echo "📡 API URL: $API_URL"
echo "🔑 Token: ${ADMIN_TOKEN:0:20}..."
echo ""

# 测试消息
TEST_MESSAGE="你好，我想了解如何使用这个服务"

echo "📝 测试消息: \"$TEST_MESSAGE\""
echo ""
echo "⏳ 正在调用 AI Bot..."
echo ""

# 调用测试端点
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/admin/test-ai-bot" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$TEST_MESSAGE\"}")

# 分离响应体和状态码
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 HTTP 状态码: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ 测试成功!"
  echo "📋 响应数据:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  
  # 提取回复
  REPLY=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('reply', ''))" 2>/dev/null)
  if [ ! -z "$REPLY" ]; then
    echo "🤖 AI Bot 回复:"
    echo "──────────────────────────────────────────────────"
    echo "$REPLY"
    echo "──────────────────────────────────────────────────"
  fi
else
  echo "❌ 测试失败!"
  echo "📋 错误响应:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "可能的原因:"
  echo "1. Token 无效或已过期"
  echo "2. API URL 不正确"
  echo "3. 服务器未运行"
  echo "4. 网络连接问题"
fi



