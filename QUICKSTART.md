# 快速开始指南

## 🚀 5 分钟快速启动

### 步骤 1: 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 步骤 2: 启动服务

**打开两个终端窗口：**

**终端 1 - 启动前端：**
```bash
npm run dev
```

**终端 2 - 启动后端：**
```bash
cd server
npm run dev
```

### 步骤 3: 访问应用

打开浏览器访问：http://localhost:3000

## 🔑 配置 API Key（可选）

如果您想使用真实的图片增强功能，需要配置 API key：

1. 注册 [autoenhance.ai](https://autoenhance.ai) 获取 API key
2. 创建 `server/.env` 文件：
   ```env
   AUTOENHANCE_API_KEY=your_api_key_here
   AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
   PORT=3001
   ```
3. 重启后端服务器

**注意：** 如果不配置 API key，系统会返回原始图片（仅用于演示）。

## 📱 使用说明

1. **上传照片**：点击上传区域，选择或拖拽照片
2. **AI 增强**：点击"开始 AI 增强"按钮
3. **下载结果**：增强完成后，点击"下载增强照片"

## 🛠️ 故障排除

### 端口被占用
如果 3000 或 3001 端口被占用，可以修改：
- 前端端口：修改 `vite.config.js` 中的 `port`
- 后端端口：修改 `server/.env` 中的 `PORT`

### API 连接失败
- 检查后端服务是否正常运行
- 检查 `VITE_ENHANCE_API_URL` 环境变量是否正确
- 查看浏览器控制台和服务器日志

### 图片上传失败
- 确保图片大小不超过 10MB
- 确保图片格式为 JPG 或 PNG

## 📚 更多信息

查看 [README.md](./README.md) 获取完整文档。


