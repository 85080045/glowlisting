# 如何找到 Render 后端 URL

## 方法1: 在 Render 控制台查看

1. **登录 Render 账号**
   - 访问 https://dashboard.render.com
   - 使用你的账号登录

2. **找到后端服务**
   - 在 Dashboard 中找到你的后端服务（通常是 "Web Service" 类型）
   - 服务名称可能类似：`glowlisting-backend` 或 `glowlisting-server`

3. **查看服务 URL**
   - 点击进入服务详情页
   - 在页面顶部会显示服务的 URL
   - 格式通常是：`https://your-service-name.onrender.com`
   - 或者：`https://your-service-name-xxxx.onrender.com`

4. **完整的 API URL**
   - 后端 URL + `/api`
   - 例如：`https://glowlisting-backend.onrender.com/api`

## 方法2: 从前端代码中查找

1. **检查 Vercel 环境变量**
   - 登录 Vercel
   - 进入项目设置
   - 查看环境变量 `VITE_API_URL`
   - 这个值就是后端 URL

2. **检查浏览器网络请求**
   - 打开网站
   - 打开浏览器开发者工具 (F12)
   - 切换到 "Network" 标签
   - 发送一条消息或执行任何操作
   - 查看请求的 URL，可以看到后端地址

## 方法3: 从代码配置中查找

检查以下文件：
- `.env` 文件（如果有）
- `vite.config.js`
- Vercel 项目设置中的环境变量

## 常见格式

Render 后端 URL 通常格式为：
- `https://your-service-name.onrender.com`
- `https://your-service-name-xxxx.onrender.com` (带随机后缀)

完整的 API 端点：
- `https://your-service-name.onrender.com/api`

## 快速测试

找到 URL 后，可以在浏览器中直接访问：
```
https://your-service-name.onrender.com/api/health
```
或者
```
https://your-service-name.onrender.com/
```

如果返回 JSON 或正常响应，说明 URL 正确。

