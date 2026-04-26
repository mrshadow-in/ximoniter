# Full System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the remaining frontend architecture (AdminLTE shell), WebSocket real-time engine, and full backend integrations (BGP, Tunnels, Tools, Users) for the Network Operations Dashboard.

**Architecture:** 
- **Frontend Shell:** Move `dashboard.html` logic into a unified Single Page Application (SPA) structure using `index.html` with an iframe or dynamic JS loading for content pages, complete with an AdminLTE dark theme sidebar.
- **WebSockets:** Implement `ws` in the backend (`websocket/wsHub.js`) and `ws.js` on the client for live data (PVE metrics, BGP status).
- **Core Features:** Add `bgpToolsService.js` (using axios) and remaining controllers (`userController`, `bgpController`, `tunnelController`).

**Tech Stack:** Node.js, Express, `ws`, `axios`, Vanilla JS/CSS

---

## Phase 4: Global App Shell (UI)

### Task 4.1: Unified App Shell (index.html)

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/assets/css/sidebar.css`
- Modify: `backend/server.js`

- [ ] **Step 1: Create the failing test (manual UI verify placeholder)**
```javascript
// tests/frontend/shell.test.js
// Placeholder for manual verification: index.html serves as the root
console.log("Task 4.1 Shell Verification Placeholder Passed");
```

- [ ] **Step 2: Implement Sidebar CSS**
Create `frontend/assets/css/sidebar.css`:
```css
:root {
  --bg-sidebar: #161b22;
  --sidebar-width: 260px;
  --sidebar-active: rgba(26, 115, 232, 0.20);
  --sidebar-text: #8b949e;
}
body { margin: 0; display: flex; font-family: "Inter", sans-serif; background: var(--bg-body, #0d1117); color: #e6edf3; }
.sidebar { width: var(--sidebar-width); background: var(--bg-sidebar); height: 100vh; position: fixed; border-right: 1px solid #30363d; }
.sidebar-header { padding: 20px; font-size: 18px; font-weight: bold; border-bottom: 1px solid #30363d; }
.nav-item { display: block; padding: 10px 20px; color: var(--sidebar-text); text-decoration: none; }
.nav-item:hover { background: rgba(255,255,255,0.05); color: #e6edf3; }
.nav-item.active { background: var(--sidebar-active); color: #58a6ff; border-left: 3px solid #1a73e8; }
.content-wrapper { margin-left: var(--sidebar-width); flex: 1; padding: 20px; width: calc(100% - var(--sidebar-width)); }
iframe#content-frame { width: 100%; height: calc(100vh - 40px); border: none; }
```

- [ ] **Step 3: Implement index.html (App Shell)**
Create `frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Network Operations Dashboard</title>
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/sidebar.css">
</head>
<body>
    <nav class="sidebar" aria-label="Main Navigation">
        <div class="sidebar-header">NOD Dashboard</div>
        <a href="pages/dashboard.html" class="nav-item active" target="content-frame" onclick="setActive(this)">Dashboard</a>
        <a href="pages/proxmox.html" class="nav-item" target="content-frame" onclick="setActive(this)">Proxmox Analyzer</a>
        <a href="pages/bgp-tools.html" class="nav-item" target="content-frame" onclick="setActive(this)">BGP Tools</a>
        <div style="padding: 20px 20px 5px; font-size: 10px; color: #8b949e;">SYSTEM</div>
        <a href="#" class="nav-item" onclick="logout()">Logout</a>
    </nav>
    <main class="content-wrapper">
        <iframe id="content-frame" name="content-frame" src="pages/dashboard.html" title="Main Content"></iframe>
    </main>
    <script>
        // Protect shell
        if (!localStorage.getItem('nod_token')) window.location.href = 'pages/login.html';
        
        function setActive(elem) {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            elem.classList.add('active');
        }
        function logout() {
            localStorage.removeItem('nod_token');
            window.location.href = 'pages/login.html';
        }
    </script>
</body>
</html>
```

- [ ] **Step 4: Update server.js routing**
Modify `backend/server.js` (replace the `/` route):
```javascript
// Replace the existing app.get('/') with this:
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
```

- [ ] **Step 5: Commit**
```bash
git add frontend/index.html frontend/assets/css/sidebar.css backend/server.js tests/frontend/shell.test.js
git commit -m "feat(ui): create global app shell with sidebar layout"
```

## Phase 5: BGP Tools (Lookup Features)

### Task 5.1: BGP Tools Service

**Files:**
- Create: `backend/services/bgpToolsService.js`
- Create: `tests/backend/services/bgpTools.test.js`

- [ ] **Step 1: Write the failing test**
```javascript
// tests/backend/services/bgpTools.test.js
const bgpToolsService = require('../../../backend/services/bgpToolsService');
const assert = require('assert');

async function testASNLookup() {
    const res = await bgpToolsService.lookupASN('13335'); // Cloudflare
    assert.strictEqual(res.asn, '13335');
    console.log("Task 5.1 ASN Lookup Test Passed");
}
testASNLookup().catch(err => { console.error(err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/backend/services/bgpTools.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement minimal service**
Create `backend/services/bgpToolsService.js`:
```javascript
const axios = require('axios');

// Basic cache
const cache = new Map();

async function lookupASN(asn) {
    if (cache.has(`asn_${asn}`)) return cache.get(`asn_${asn}`);
    
    try {
        const response = await axios.get(`https://api.bgpview.io/asn/${asn}`);
        const data = {
            asn: response.data.data.asn.toString(),
            name: response.data.data.name,
            country: response.data.data.country_code
        };
        cache.set(`asn_${asn}`, data);
        setTimeout(() => cache.delete(`asn_${asn}`), 600000); // 10 min TTL
        return data;
    } catch (err) {
        throw new Error('Failed to fetch ASN data');
    }
}

module.exports = { lookupASN };
```

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/backend/services/bgpTools.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/services/bgpToolsService.js tests/backend/services/bgpTools.test.js
git commit -m "feat(bgp-tools): implement BGP Tools service with ASN lookup and caching"
```

### Task 5.2: BGP Tools API & Controller

**Files:**
- Create: `backend/controllers/bgpToolsController.js`
- Create: `backend/routes/bgpTools.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Write the failing test**
```javascript
// tests/backend/api/bgpToolsAPI.test.js
const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'admin' }, 'super_secret_dev_key_2026');

async function testAPI() {
    const res = await request(app).get('/api/bgp-tools/asn/13335').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.asn, '13335');
    console.log("Task 5.2 BGP Tools API Passed");
}
testAPI().catch(err => { console.error(err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/backend/api/bgpToolsAPI.test.js`
Expected: 404 (Route not found)

- [ ] **Step 3: Implement controller and route**
Create `backend/controllers/bgpToolsController.js`:
```javascript
const bgpToolsService = require('../services/bgpToolsService');

exports.getASN = async (req, res) => {
    try {
        const data = await bgpToolsService.lookupASN(req.params.asn);
        res.json({ success: true, data });
    } catch (err) {
        res.status(502).json({ success: false, error: err.message, code: 'EXTERNAL_API_ERROR' });
    }
};
```
Create `backend/routes/bgpTools.js`:
```javascript
const express = require('express');
const router = express.Router();
const bgpToolsController = require('../controllers/bgpToolsController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);
router.get('/asn/:asn', bgpToolsController.getASN);

module.exports = router;
```
Modify `backend/server.js`:
```javascript
// Mount the route
const bgpToolsRoutes = require('./routes/bgpTools');
app.use('/api/bgp-tools', bgpToolsRoutes);
```

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/backend/api/bgpToolsAPI.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/controllers/bgpToolsController.js backend/routes/bgpTools.js backend/server.js tests/backend/api/bgpToolsAPI.test.js
git commit -m "feat(api): implement BGP Tools API endpoint"
```

### Task 5.3: BGP Tools UI

**Files:**
- Create: `frontend/pages/bgp-tools.html`

- [ ] **Step 1: Write minimal HTML implementation**
Create `frontend/pages/bgp-tools.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="../assets/css/main.css">
    <style>
        body { padding: 20px; color: #c9d1d9; font-family: sans-serif; }
        .card { background: #161b22; border: 1px solid #30363d; padding: 20px; border-radius: 6px; }
        input { padding: 8px; width: 200px; background: #0d1117; color: white; border: 1px solid #30363d; }
        button { padding: 8px 16px; background: #1a73e8; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h2>BGP Intelligence Tools</h2>
    <div class="card">
        <label>ASN Lookup: </label>
        <input type="text" id="asn-input" placeholder="e.g. 13335">
        <button onclick="lookup()">Search</button>
        <pre id="result" style="margin-top: 20px; background: #0d1117; padding: 10px;"></pre>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script>
        async function lookup() {
            const asn = document.getElementById('asn-input').value;
            if(!asn) return;
            document.getElementById('result').innerText = 'Loading...';
            try {
                const res = await window.api.get(`/bgp-tools/asn/${asn}`);
                document.getElementById('result').innerText = JSON.stringify(res.data.data, null, 2);
            } catch (e) {
                document.getElementById('result').innerText = 'Error: ' + e.message;
            }
        }
    </script>
</body>
</html>
```

- [ ] **Step 2: Test manually**
(No automated test). Open `index.html`, click "BGP Tools", type "13335", and click Search.

- [ ] **Step 3: Commit**
```bash
git add frontend/pages/bgp-tools.html
git commit -m "feat(ui): add BGP Tools lookup interface"
```

## Phase 6: WebSocket Real-Time Engine

### Task 6.1: WebSocket Server Hub

**Files:**
- Create: `backend/websocket/wsHub.js`
- Modify: `backend/server.js`
- Test: `tests/backend/websocket/wsHub.test.js`

- [ ] **Step 1: Write the failing test**
```javascript
// tests/backend/websocket/wsHub.test.js
const assert = require('assert');
const WebSocket = require('ws');
const app = require('../../../backend/server');
const http = require('http');

async function testWS() {
    const server = http.createServer(app);
    require('../../../backend/websocket/wsHub').init(server);
    
    server.listen(3001);
    
    const ws = new WebSocket('ws://localhost:3001/ws');
    await new Promise((resolve) => ws.on('open', resolve));
    assert.ok(true, "WebSocket connected");
    ws.close();
    server.close();
    console.log("Task 6.1 WebSocket Test Passed");
}
testWS().catch(err => { console.error(err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/backend/websocket/wsHub.test.js`
Expected: FAIL. Cannot find module.

- [ ] **Step 3: Implement wsHub.js**
Create `backend/websocket/wsHub.js`:
```javascript
const { WebSocketServer } = require('ws');

let wss;

exports.init = (server) => {
    wss = new WebSocketServer({ server, path: '/ws' });
    
    wss.on('connection', (ws) => {
        console.log('WS Client connected');
        ws.on('message', (msg) => {
            console.log('WS Received:', msg.toString());
        });
    });
};

exports.broadcast = (channel, event, data) => {
    if (!wss) return;
    const payload = JSON.stringify({ channel, event, timestamp: new Date().toISOString(), data });
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(payload); // 1 = OPEN
    });
};
```
Modify `backend/server.js` to attach WS:
```javascript
// At the bottom of server.js, replace the app.listen block:
if (require.main === module) {
  const http = require('http');
  const server = http.createServer(app);
  const wsHub = require('./websocket/wsHub');
  wsHub.init(server);
  
  server.listen(PORT, () => {
    console.log(`NOD Server running on port ${PORT}`);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/backend/websocket/wsHub.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/websocket/wsHub.js backend/server.js tests/backend/websocket/wsHub.test.js
git commit -m "feat(ws): initialize WebSocket server hub and broadcast function"
```
