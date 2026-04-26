# Authentication and App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the JWT authentication system, a secure login page, and the global application shell (sidebar navigation) as a Single Page Application foundation.

**Architecture:**
- **Auth:** `authController` issues JWTs upon verifying bcrypt-hashed passwords. A `verifyJWT` middleware protects `/api/*` routes.
- **Frontend:** A standalone `login.html` authenticates and saves the token to `localStorage`. Upon success, it redirects to `index.html`, which serves as the App Shell (Sidebar + Top Navbar) and dynamically loads content or acts as the root router.
- **API Interceptor:** Axios is configured to automatically attach `Bearer <token>` to requests and redirect to `/login.html` on 401 responses.

**Tech Stack:** Node.js, Express, `jsonwebtoken`, `bcrypt`, HTML/CSS/Vanilla JS

---

## Phase 3: Authentication System

### Task 3.1: JWT Verification Middleware

**Files:**
- Create: `backend/middleware/verifyJWT.js`
- Test: `tests/backend/middleware/verifyJWT.test.js`
- Modify: `backend/config/env.js` (create to hold JWT_SECRET)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/backend/middleware/verifyJWT.test.js
const verifyJWT = require('../../../backend/middleware/verifyJWT');
const assert = require('assert');

function testNoToken() {
    const req = { headers: {} };
    const res = { 
        status: (code) => { 
            assert.strictEqual(code, 401); 
            return { json: (data) => assert.strictEqual(data.code, "AUTH_REQUIRED") };
        }
    };
    let nextCalled = false;
    
    verifyJWT(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, "Next should not be called without a token");
    console.log("Task 3.1 Middleware Test Passed");
}
testNoToken();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/backend/middleware/verifyJWT.test.js`
Expected: FAIL because `verifyJWT` does not exist or isn't a function.

- [ ] **Step 3: Write minimal implementation**

Create `backend/config/env.js`:
```javascript
module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_dev_key_2026',
    JWT_EXPIRY: '8h'
};
```

Create `backend/middleware/verifyJWT.js`:
```javascript
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    }
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
        req.user = decoded;
        next();
    });
};

module.exports = verifyJWT;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/backend/middleware/verifyJWT.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/middleware/verifyJWT.js backend/config/env.js tests/backend/middleware/verifyJWT.test.js
git commit -m "feat(auth): add verifyJWT middleware and environment config"
```

### Task 3.2: Auth Controller (Login)

**Files:**
- Create: `backend/controllers/authController.js`
- Create: `backend/routes/auth.js`
- Modify: `backend/server.js`
- Test: `tests/backend/api/auth.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/backend/api/auth.test.js
const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');

async function testLogin() {
    // Attempt login with seeded admin
    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin_password_2026' });
        
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token, "Should return a JWT token");
    console.log("Task 3.2 Auth API Test Passed");
}
testLogin().catch(err => { console.error(err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/backend/api/auth.test.js`
Expected: 404 because `/api/auth/login` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `backend/controllers/authController.js`:
```javascript
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(422).json({ success: false, error: 'Missing credentials', code: 'VALIDATION_ERROR' });

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials', code: 'AUTH_FAILED' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials', code: 'AUTH_FAILED' });

        // Update last login
        db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRY }
        );

        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
    }
};
```

Create `backend/routes/auth.js`:
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
module.exports = router;
```

Modify `backend/server.js`:
```javascript
// Add these lines below the other route mounts
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/backend/api/auth.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/authController.js backend/routes/auth.js backend/server.js tests/backend/api/auth.test.js
git commit -m "feat(auth): implement login endpoint returning JWT"
```

### Task 3.3: Login UI & Axios Interceptor

**Files:**
- Create: `frontend/pages/login.html`
- Modify: `frontend/assets/js/api.js`

- [ ] **Step 1: Write the minimal implementation for API Interceptor**

Modify `frontend/assets/js/api.js` to attach tokens and handle 401s:
```javascript
const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('nod_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// Response interceptor to handle 401
api.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('nod_token');
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = '/pages/login.html';
        }
    }
    return Promise.reject(error);
});

window.api = api;
```

- [ ] **Step 2: Create the Login Page**

Create `frontend/pages/login.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login - NOD</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; background: #0d1117; color: #c9d1d9; font-family: sans-serif; }
        .login-box { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 20px; width: 300px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .login-box input { width: 100%; padding: 8px; margin-bottom: 15px; background: #0d1117; border: 1px solid #30363d; color: white; border-radius: 4px; box-sizing: border-box; }
        .login-box button { width: 100%; padding: 8px; background: #238636; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .error { color: #ff7b72; margin-bottom: 10px; font-size: 14px; display: none; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>NOD Sign In</h2>
        <div id="error-msg" class="error" role="alert"></div>
        <form id="login-form">
            <label for="username">Username</label>
            <input type="text" id="username" required>
            <label for="password">Password</label>
            <input type="password" id="password" required>
            <button type="submit">Sign In</button>
        </form>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-msg');
            
            try {
                const res = await window.api.post('/auth/login', { username, password });
                if (res.data.success) {
                    localStorage.setItem('nod_token', res.data.token);
                    window.location.href = 'dashboard.html'; // Or index.html
                }
            } catch (err) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = err.response?.data?.error || 'Login failed';
            }
        });
    </script>
</body>
</html>
```

- [ ] **Step 3: Test manually**
(No automated UI test). The UI handles login securely.

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/login.html frontend/assets/js/api.js
git commit -m "feat(ui): add login page and configured axios interceptor for JWT"
```

### Task 3.4: Protect API Endpoints

**Files:**
- Modify: `backend/routes/proxmox.js`
- Modify: `backend/routes/settings.js`

- [ ] **Step 1: Write failing test**
(A simple check using curl or supertest on a protected route without a token)
```javascript
// tests/backend/api/protected.test.js
const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');

async function testProtected() {
    const res = await request(app).get('/api/settings/sandbox');
    assert.strictEqual(res.status, 401, "Should be unauthorized without token");
    console.log("Task 3.4 Protected Route Test Passed");
}
testProtected().catch(err => { console.error(err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/backend/api/protected.test.js`
Expected: Fails because the route returns 200 (currently unprotected).

- [ ] **Step 3: Implement protection**

Modify `backend/routes/proxmox.js`:
```javascript
const express = require('express');
const router = express.Router();
const proxmoxController = require('../controllers/proxmoxController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT); // Protect all proxmox routes
router.get('/:node/history', proxmoxController.getHistory);

module.exports = router;
```

Modify `backend/routes/settings.js`:
```javascript
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT); // Protect all settings routes
router.get('/sandbox', settingsController.getSandboxMode);
router.post('/sandbox', settingsController.toggleSandboxMode);

module.exports = router;
```

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/backend/api/protected.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add backend/routes/proxmox.js backend/routes/settings.js tests/backend/api/protected.test.js
git commit -m "feat(auth): protect existing API endpoints with verifyJWT middleware"
```

---
