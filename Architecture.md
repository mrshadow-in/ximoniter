# Architecture.md — Network Operations Dashboard

## 1. Folder Structure

```
/project
├── backend/
│   ├── server.js                    ← Express app entry point + WS server init
│   ├── config/
│   │   ├── db.js                    ← SQLite connection + schema init
│   │   ├── cache.js                 ← In-memory TTL cache module
│   │   └── env.js                   ← Validated env config object
│   │
│   ├── middleware/
│   │   ├── verifyJWT.js             ← JWT decode + attach req.user
│   │   ├── checkRole.js             ← Role-based access: checkRole("admin")
│   │   ├── checkFeature.js          ← Feature flag: checkFeature("bgp_tools")
│   │   ├── rateLimiter.js           ← express-rate-limit setup
│   │   └── validator.js             ← Input validation helpers (express-validator)
│   │
│   ├── controllers/
│   │   ├── authController.js        ← login, logout, refresh, register
│   │   ├── bgpController.js         ← BGP status, switch, peer list
│   │   ├── tunnelController.js      ← EOIP list, enable, disable, coordinated switch
│   │   ├── proxmoxController.js     ← Nodes, VMs, config CRUD
│   │   ├── bgpToolsController.js    ← ASN/IP/Prefix lookup endpoints
│   │   └── userController.js        ← User CRUD (admin only)
│   │
│   ├── routes/
│   │   ├── auth.js                  ← POST /api/auth/login, /logout, /refresh
│   │   ├── bgp.js                   ← GET/POST /api/bgp/*
│   │   ├── tunnels.js               ← POST /api/tunnels/*
│   │   ├── proxmox.js               ← GET/POST/DELETE /api/proxmox/*
│   │   ├── bgpTools.js              ← GET /api/bgp-tools/*
│   │   └── users.js                 ← GET/POST/PUT/DELETE /api/users/*
│   │
│   ├── services/
│   │   ├── bgpService.js            ← node-routeros wrapper for BGP ops
│   │   ├── tunnelService.js         ← EOIP tunnel control via RouterOS API
│   │   ├── proxmoxService.js        ← Proxmox REST API integration
│   │   ├── bgpToolsService.js       ← BGPView + IPInfo API + cache
│   │   ├── pingService.js           ← node-ping wrapper + stats tracking
│   │   ├── failoverService.js       ← Failover state machine + scheduler
│   │   └── logService.js            ← Structured JSON logger
│   │
│   └── websocket/
│       ├── wsHub.js                 ← WS server setup, client registry, broadcast
│       └── channels/
│           ├── bgpChannel.js        ← BGP status push loop
│           ├── proxmoxChannel.js    ← Proxmox metrics push loop
│           └── pingChannel.js       ← Ping status push loop
│
├── frontend/
│   ├── index.html                   ← App shell (single page, sidebar layout)
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css             ← Global dark theme variables + resets
│   │   │   ├── sidebar.css          ← Sidebar nav styles
│   │   │   ├── cards.css            ← Stat cards, info cards
│   │   │   ├── tables.css           ← Data table styles
│   │   │   └── charts.css           ← Chart container styles
│   │   ├── js/
│   │   │   ├── app.js               ← Router, auth guard, WS init
│   │   │   ├── api.js               ← Axios wrapper with JWT headers
│   │   │   ├── ws.js                ← WebSocket client + reconnect logic
│   │   │   └── utils.js             ← Formatters, helpers
│   │   └── img/
│   │       └── logo.svg
│   │
│   └── pages/
│       ├── login.html               ← Login page (standalone)
│       ├── dashboard.html           ← Overview: stats, mini-charts
│       ├── bgp.html                 ← MikroTik BGP management page
│       ├── tunnels.html             ← EOIP tunnel manager page
│       ├── proxmox.html             ← Proxmox nodes + VMs page
│       ├── bgp-tools.html           ← BGP intelligence lookup page
│       └── users.html               ← User management page (admin)
│
├── config/
│   └── default.json                 ← Non-secret default config values
│
├── logs/
│   ├── app.log
│   ├── failover.log
│   ├── access.log
│   └── error.log
│
├── data/
│   └── nod.db                       ← SQLite database file
│
├── .env                             ← Secrets (gitignored)
├── .env.example                     ← Template with all required keys
├── package.json
└── README.md
```

---

## 2. Module Dependency Graph

```
server.js
  ├── config/db.js
  ├── config/env.js
  ├── middleware/* (applied globally)
  ├── routes/* (mounted at /api/*)
  │     └── controllers/* (handle requests)
  │           └── services/* (business logic)
  │                 ├── bgpService.js → node-routeros → MikroTik
  │                 ├── proxmoxService.js → axios → Proxmox API
  │                 ├── bgpToolsService.js → axios → BGPView/IPInfo
  │                 ├── pingService.js → node-ping
  │                 └── failoverService.js → bgpService + tunnelService
  └── websocket/wsHub.js
        └── channels/* (push data to WS clients)
              └── services/* (same services as above)
```

---

## 3. API Endpoint Reference

### Authentication

```
POST   /api/auth/login           Body: {username, password} → {token, user}
POST   /api/auth/logout          Header: Authorization: Bearer <token>
POST   /api/auth/refresh         Header: Authorization: Bearer <token> → {token}
```

### BGP Management

```
GET    /api/bgp/status           → All BGP peer states
POST   /api/bgp/switch           Body: {router, action: "primary"|"secondary"}
GET    /api/bgp/asn/:asn         → ASN info from router routing table
GET    /api/bgp/peers            → Full peer list with session details
```

### Tunnel Management

```
GET    /api/tunnels              → List all EOIP tunnels
POST   /api/tunnels/eoip/switch  Body: {tunnelId, action: "enable"|"disable"}
POST   /api/tunnels/coordinated  Body: {action: "failover"|"restore"}
```

### Proxmox

```
GET    /api/proxmox/nodes                    → All configured nodes
GET    /api/proxmox/:node/status             → Node CPU/RAM/load
GET    /api/proxmox/:node/vms                → VM list with metrics
GET    /api/proxmox/:node/vm/:vmid           → Single VM detail
POST   /api/proxmox/config                   Body: ProxmoxConfig object
GET    /api/proxmox/config                   → List all node configs
DELETE /api/proxmox/config/:id              → Remove node config
```

### BGP Intelligence Tools

```
GET    /api/bgp-tools/asn/:asn              → ASN detail + prefixes
GET    /api/bgp-tools/ip/:ip               → IP detail + ASN
GET    /api/bgp-tools/prefix/:net/:cidr    → Prefix/CIDR detail
```

### User Management (Admin+)

```
GET    /api/users                → List all users
POST   /api/users                → Create user
PUT    /api/users/:id            → Update user (role, password)
DELETE /api/users/:id            → Delete user
```

### System / Health

```
GET    /api/health               → Server uptime, version (no auth)
GET    /api/logs                 → Recent logs (admin+)
GET    /api/events               → Recent failover events (staff+)
```

---

## 4. Service Interface Contracts

### bgpService.js

```javascript
// Returns array of peer objects
getPeerStatus(routerConfig) → Promise<BGPPeer[]>

// Enable or disable a specific peer
setPeerState(routerConfig, peerName, enabled: boolean) → Promise<void>

// Get active routes count
getRouteCount(routerConfig) → Promise<number>

// Get all active routes
getRoutes(routerConfig) → Promise<Route[]>
```

### proxmoxService.js

```javascript
// Returns node hardware stats
getNodeStatus(nodeConfig) → Promise<NodeStats>

// Returns array of VM metrics
getVMs(nodeConfig) → Promise<VM[]>

// Returns single VM detail
getVM(nodeConfig, vmid) → Promise<VMDetail>
```

### bgpToolsService.js

```javascript
// ASN detail + prefixes + upstreams
lookupASN(asn: string) → Promise<ASNResult>

// IP ownership + routing info
lookupIP(ip: string) → Promise<IPResult>

// CIDR block detail
lookupPrefix(network: string, cidr: number) → Promise<PrefixResult>
```

### failoverService.js

```javascript
// Start the failover monitoring loop
start() → void

// Force manual failover
triggerFailover(reason: string) → Promise<void>

// Force manual recovery
triggerRecovery() → Promise<void>

// Get current failover state
getState() → FailoverState
```

---

## 5. WebSocket Protocol

### Client → Server

```json
{
  "type": "subscribe",
  "channels": ["bgp", "proxmox", "ping", "failover"]
}
```

### Server → Client (standard update)

```json
{
  "channel": "proxmox",
  "event": "metrics_update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { ... }
}
```

### Server → Client (failover alert)

```json
{
  "channel": "failover",
  "event": "failover_triggered",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "reason": "4 consecutive ping failures",
    "from": "PRIMARY",
    "to": "SECONDARY",
    "pingTarget": "8.8.8.8"
  }
}
```

### Reconnection Strategy (client-side)

```
Initial delay: 1s
Max delay: 30s
Backoff multiplier: 2x
Max retries: unlimited
```

---

## 6. Data Models

### User

```typescript
interface User {
  id: number;
  username: string;
  password_hash: string;
  role: "super_admin" | "admin" | "staff" | "feature_user";
  created_at: string;
  last_login: string | null;
}
```

### BGP Peer

```typescript
interface BGPPeer {
  name: string;
  remoteAddress: string;
  remoteAs: number;
  state: "established" | "active" | "idle" | "connect" | "opensent";
  uptime: string;
  prefixCount: number;
  routerId: string;
}
```

### Proxmox Node Config

```typescript
interface ProxmoxConfig {
  id?: number;
  name: string;
  host: string;
  port: number;           // default: 8006
  node: string;           // PVE node name, e.g. "pve"
  token_id: string;       // e.g. "root@pam!nod-token"
  token_secret: string;
  rejectUnauthorized: boolean;
}
```

### Failover State

```typescript
interface FailoverState {
  state: "PRIMARY" | "FAILOVER" | "RECOVERING";
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailoverAt: string | null;
  lastRecoveryAt: string | null;
  pingTarget: string;
  latencyMs: number | null;
  packetLoss: number;
}
```

---

## 7. External Library Versions (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "node-routeros": "^1.2.1",
    "node-ping": "^0.4.4",
    "axios": "^1.6.2",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "better-sqlite3": "^9.3.0",
    "dotenv": "^16.3.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 8. Error Handling Strategy

**All controllers follow this pattern:**

```javascript
try {
  const result = await service.operation();
  res.json({ success: true, data: result });
} catch (err) {
  logService.error({ action, error: err.message, user: req.user?.id });
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    code: err.code || "INTERNAL_ERROR"
  });
}
```

**Error codes used across the system:**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| AUTH_REQUIRED | 401 | Missing or invalid JWT |
| FORBIDDEN | 403 | Insufficient role |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Bad input |
| ROUTER_OFFLINE | 503 | Cannot reach MikroTik |
| PROXMOX_ERROR | 502 | Proxmox API error |
| EXTERNAL_API_ERROR | 502 | BGPView/IPInfo failure |
| INTERNAL_ERROR | 500 | Unexpected server error |
