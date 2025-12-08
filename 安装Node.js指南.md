# 📥 安装 Node.js 指南

## 问题诊断

您的系统目前**没有安装 Node.js**，这是运行本项目的前置要求。

---

## 🍎 macOS 安装方法

### 方法 1: 官方安装包（推荐）

1. **访问 Node.js 官网**
   - 打开浏览器访问：https://nodejs.org/
   - 点击下载 LTS 版本（推荐，更稳定）

2. **下载安装包**
   - 选择 macOS 安装包（.pkg 文件）
   - 下载完成后双击安装

3. **安装步骤**
   - 双击下载的 `.pkg` 文件
   - 按照安装向导完成安装
   - 安装完成后重启终端

4. **验证安装**
   打开终端运行：
   ```bash
   node --version
   npm --version
   ```
   如果显示版本号，说明安装成功！

---

### 方法 2: 使用 Homebrew（如果已安装）

如果您已经安装了 Homebrew，可以运行：

```bash
brew install node
```

---

## ✅ 安装完成后

安装好 Node.js 后，按照以下步骤运行项目：

### 1. 安装项目依赖

```bash
# 进入项目目录
cd /Users/masonding/Downloads/Pholisting

# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 2. 启动服务

**打开两个终端窗口：**

**终端 1 - 前端：**
```bash
cd /Users/masonding/Downloads/Pholisting
npm run dev
```

**终端 2 - 后端：**
```bash
cd /Users/masonding/Downloads/Pholisting/server
npm run dev
```

### 3. 访问应用

打开浏览器访问：**http://localhost:3000**

---

## 🔍 验证 Node.js 安装

安装完成后，在终端运行以下命令验证：

```bash
node --version   # 应该显示 v18.x.x 或更高版本
npm --version    # 应该显示 9.x.x 或更高版本
```

---

## ❓ 常见问题

### Q: 安装后还是提示找不到 node？
**A:** 请重启终端或重新打开终端窗口。

### Q: 需要安装哪个版本？
**A:** 推荐安装 LTS（长期支持）版本，通常是 v18 或 v20。

### Q: 安装需要多长时间？
**A:** 通常 5-10 分钟，取决于网络速度。

---

## 📞 需要帮助？

如果安装过程中遇到问题：
1. 确保您有管理员权限
2. 检查网络连接
3. 尝试重新下载安装包

安装完成后，请回到项目目录运行 `npm install` 和 `npm run dev`。


