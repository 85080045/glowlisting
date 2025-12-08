# Pholisting™ - AI 智能照片增强工具

专为房产中介、Airbnb 房东和租房者打造的 AI 照片增强平台。只需上传照片，AI 自动为您优化，无需专业摄影师。

## ✨ 功能特点

- 🚀 **AI 智能增强** - 自动优化亮度、对比度、色彩和清晰度
- 📱 **简单易用** - 手机拍照上传，无需专业技能
- ⚡ **秒级处理** - 上传后几秒钟即可获得增强结果
- 💰 **节省成本** - 无需聘请专业摄影师
- 🎨 **专业效果** - 媲美专业摄影师的作品质量
- 📦 **批量处理** - 支持批量上传和处理多张照片

## 🛠️ 技术栈

### 前端
- React 18
- Vite
- Tailwind CSS
- Lucide React (图标)

### 后端
- Node.js
- Express
- Multer (文件上传)
- Axios (API 调用)

## 📦 安装和运行

### 前置要求
- Node.js 18+ 
- npm 或 yarn

### 1. 安装前端依赖

```bash
npm install
```

### 2. 安装后端依赖

```bash
cd server
npm install
cd ..
```

### 3. 配置环境变量

创建 `.env` 文件（前端）：

```env
VITE_ENHANCE_API_URL=http://localhost:3001/api/enhance
```

创建 `server/.env` 文件（后端）：

```env
AUTOENHANCE_API_KEY=your_api_key_here
AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
PORT=3001
```

### 4. 启动开发服务器

**终端 1 - 启动前端：**
```bash
npm run dev
```

**终端 2 - 启动后端：**
```bash
cd server
npm run dev
```

访问 http://localhost:3000 查看应用

## 🔌 API 集成

### 集成 autoenhance.ai

1. 注册并获取 API key：访问 [autoenhance.ai](https://autoenhance.ai) 获取 API key
2. 在 `server/.env` 中配置：
   ```env
   AUTOENHANCE_API_KEY=your_api_key_here
   AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
   ```
3. 重启后端服务器

### 集成其他图片增强 API

您可以在 `server/index.js` 中修改 `/api/enhance` 端点，集成其他图片增强服务：

- Adobe Photoshop API
- Remove.bg API
- 其他 AI 图片处理服务

## 📁 项目结构

```
Pholisting™/
├── src/
│   ├── components/          # React 组件
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── UploadSection.jsx
│   │   ├── Features.jsx
│   │   ├── Testimonials.jsx
│   │   └── Footer.jsx
│   ├── services/            # API 服务
│   │   └── enhanceService.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/                  # 后端服务器
│   ├── index.js
│   └── package.json
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 构建生产版本

### 构建前端

```bash
npm run build
```

构建产物在 `dist/` 目录

### 部署

#### 前端部署
- Vercel
- Netlify
- GitHub Pages
- 任何静态文件托管服务

#### 后端部署
- Heroku
- Railway
- DigitalOcean
- AWS
- 任何支持 Node.js 的云服务

## 🔒 安全注意事项

1. **API Key 安全**：永远不要将 API key 提交到 Git 仓库
2. **文件大小限制**：已设置 10MB 的文件大小限制
3. **CORS 配置**：生产环境请配置正确的 CORS 策略
4. **速率限制**：建议添加 API 调用速率限制

## 📝 开发计划

- [ ] 批量图片处理
- [ ] 图片编辑功能（裁剪、旋转等）
- [ ] 用户账户系统
- [ ] 图片历史记录
- [ ] 更多 AI 增强选项
- [ ] 移动端 App

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📧 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件

---

Made with ❤️ for real estate professionals

