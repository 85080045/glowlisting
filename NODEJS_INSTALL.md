# Installing Node.js

## If Node.js is not installed

Node.js is required to run this project.

---

## macOS

### Option 1: Official installer (recommended)

1. Go to https://nodejs.org/
2. Download the **LTS** version
3. Run the downloaded `.pkg` and follow the steps
4. Restart the terminal when done

Verify:
```bash
node --version
npm --version
```
If you see version numbers, installation succeeded.

---

### Option 2: Homebrew (if you use it)

```bash
brew install node
```

---

## After installing

### 1. Install project dependencies

```bash
cd /path/to/Pholisting
npm install
cd server
npm install
cd ..
```

### 2. Start the app

Use two terminals.

**Terminal 1 – frontend:**
```bash
cd /path/to/Pholisting
npm run dev
```

**Terminal 2 – backend:**
```bash
cd /path/to/Pholisting/server
npm run dev
```

### 3. Open the app

Visit: **http://localhost:3000**

---

## Verify Node.js

```bash
node --version   # e.g. v18.x.x or higher
npm --version    # e.g. 9.x.x or higher
```

---

## FAQ

**Q: Terminal still says node not found?**  
Restart the terminal or open a new window.

**Q: Which version?**  
LTS (v18 or v20) is recommended.

**Q: How long does install take?**  
Usually a few minutes, depending on your connection.

After installation, run `npm install` in the project and then `npm run dev` as above.
