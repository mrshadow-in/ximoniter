# SystemDesign.md — Network Operations Dashboard

## 1. System Overview

The Network Operations Dashboard (NOD) is a centralized, real-time infrastructure management platform for ISPs and network engineers. It unifies BGP routing control, EOIP tunnel management, Proxmox hypervisor monitoring, and BGP intelligence into a single authenticated web interface.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│         Dark UI Dashboard (HTML/CSS/JS + WebSocket)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/HTTPS + WSS
┌──────────────────────────▼──────────────────────────────────────┐
│                     EXPRESS.JS API SERVER                        │
│    JWT Auth  │  RBAC Middleware  │  REST Endpoints  │  WS Hub   │
└──────┬───────┴──────┬────────────┴───────┬──────────┴─────┬─────┘
       │              │                    │                  │
  ┌────▼────┐   ┌─────▼─────┐      ┌──────▼──────┐   ┌──────▼──────┐
  │ MikroTik│   │  Proxmox  │      │  BGP Tools  │   │   Failover  │
  │ Service │   │  Service  │      │   Service   │   │   Engine    │
  └────┬────┘   └─────┬─────┘      └──────┬──────┘   └──────┬──────┘
       │              │                    │                  │
  RouterOS API   Proxmox REST         Public APIs        node-ping
  (node-routeros) (HTTPS/Token)      (bgpview.io etc.)
```

---

## 3. Core Modules

### 3.1 Authentication & RBAC

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Token issuance | jsonwebtoken | Signed JWT on login |
| Password storage | bcrypt (12 rounds) | One-way hash |
| Session validation | verifyJWT middleware | Per-request auth |
| Role enforcement | checkRole() middleware | Permission gating |
| Feature flags | checkFeature() middleware | Granular access |

**Role Hierarchy:**

```
super_admin
  └── admin
        └── staff
              └── feature_user
```

**Permission Matrix:**

| Feature | super_admin | admin | staff | feature_user |
|---------|:-----------:|:-----:|:-----:|:------------:|
| BGP switch | ✓ | ✓ | ✗ | ✗ |
| BGP view | ✓ | ✓ | ✓ | ✗ |
| Tunnel control | ✓ | ✓ | ✗ | ✗ |
| Proxmox view | ✓ | ✓ | ✓ | ✗ |
| BGP tools (full) | ✓ | ✓ | ✓ | limited |
| User management | ✓ | ✓ | ✗ | ✗ |
| System config | ✓ | ✗ | ✗ | ✗ |

---

### 3.2 BGP Management Module

**Data Flow:**

```
Frontend → POST /api/bgp/switch
         → bgpController.switch()
         → bgpService.switchPeer()
         → node-routeros (MikroTik API :8728)
         → RouterOS enable/disable BGP peer
         → WebSocket broadcast "bgp_update"
         → Frontend receives live status update
```

**Key Operations:**
- Connect to MikroTik router via persistent API session
- Query BGP peer states (`/routing/bgp/peer/print`)
- Enable/disable specific peers by name or ID
- Return session state: Established / Active / Idle
- Fetch active route count from routing table

---

### 3.3 EOIP Tunnel Management

**Tunnel State Machine:**

```
ACTIVE ──disable──▶ INACTIVE
  ▲                     │
  └───────enable────────┘

Coordinated Switch:
  disable_primary_tunnel()
  → enable_secondary_tunnel()
  → notify_bgp_switch()
  → log_event("tunnel_switched")
```

---

### 3.4 Failover Engine

**Decision Logic:**

```
PING MONITOR (every 5s):
  IF consecutive_failures >= 4:
    IF current_state == PRIMARY:
      switch_bgp(PRIMARY → SECONDARY)
      disable_eoip_primary()
      set_state(FAILOVER)
      log("failover_triggered")
      ws_broadcast("failover_event")

RECOVERY CHECK (every 30s, only in FAILOVER state):
  IF consecutive_success >= 10:
    IF time_since_failover > stable_threshold:
      switch_bgp(SECONDARY → PRIMARY)
      enable_eoip_primary()
      set_state(PRIMARY)
      log("recovery_completed")
      ws_broadcast("recovery_event")
```

**State Variables stored in memory + persisted to log:**

```json
{
  "state": "PRIMARY | FAILOVER | RECOVERING",
  "lastFailover": "ISO8601 timestamp",
  "failureCount": 0,
  "successCount": 0,
  "pingTarget": "8.8.8.8",
  "stableThresholdMs": 300000
}
```

---

### 3.5 Proxmox Monitoring

**Authentication:** Proxmox API Token (non-expiring, per-node)

**Polling Architecture:**

```
WebSocket Client connects
  → Subscribe to "proxmox" channel
  → setInterval(2000ms):
       proxmoxService.getAllNodeStats()
       → GET /api2/json/nodes/{node}/status
       → GET /api2/json/nodes/{node}/qemu
       → Aggregate + normalize metrics
       → ws.broadcast(payload)
```

**Metrics Schema:**

```json
{
  "nodeId": "pve1",
  "timestamp": 1700000000,
  "node": {
    "cpu": 0.34,
    "memUsedGb": 12.4,
    "memTotalGb": 64,
    "loadAvg": [0.5, 0.6, 0.4]
  },
  "vms": [
    {
      "vmid": 101,
      "name": "router-vm",
      "status": "running",
      "cpu": 0.12,
      "mem": 2147483648,
      "maxmem": 4294967296,
      "netin": 1024000,
      "netout": 2048000
    }
  ]
}
```

---

### 3.6 BGP Intelligence / Lookup Tools

**External API Dependencies:**

| API | Base URL | Rate Limit |
|-----|----------|-----------|
| BGPView | https://api.bgpview.io | 45 req/min |
| IPInfo | https://ipinfo.io | 50k/month free |
| RIPEstat | https://stat.ripe.net | Fair use |

**In-Memory Cache:**

```
Cache TTL: 600 seconds (10 minutes)
Key format: "asn:{asn}" | "ip:{ip}" | "prefix:{cidr}"
Eviction: TTL-based, no LRU needed (low volume)
```

**Query Routing:**

```
/api/bgp-tools/asn/13335   → bgpview /asn/13335 + /asn/13335/prefixes
/api/bgp-tools/ip/8.8.8.8  → ipinfo.io/8.8.8.8 + bgpview /ip/8.8.8.8
/api/bgp-tools/prefix/...  → bgpview /prefix/{net}/{cidr}
```

---

## 4. WebSocket System

**Server-side hub:**

```
ws://host:PORT/ws (single endpoint, channel-multiplexed)

Message format:
{
  "channel": "bgp" | "tunnels" | "proxmox" | "ping" | "failover" | "system",
  "event":   "status_update" | "failover" | "recovery" | "error",
  "data":    { ... }
}

Broadcast intervals:
  ping_status   → 5 seconds
  bgp_status    → 10 seconds
  proxmox_stats → 2-5 seconds
  tunnel_status → on-change only
  failover      → on-event only
```

---

## 5. Database Design (File-based / SQLite)

For this system, a lightweight SQLite database is used (no heavy DB overhead needed):

**Tables:**

```sql
users(id, username, password_hash, role, created_at, last_login)
routers(id, name, host, port, username, password, type, active)
proxmox_nodes(id, name, host, port, node, token_id, token_secret, reject_unauth)
tunnel_config(id, name, local_ip, remote_ip, tunnel_id, type, enabled)
events(id, type, message, user_id, created_at)
bgp_sessions(id, router_id, peer_name, peer_ip, peer_asn, state, updated_at)
```

---

## 6. Security Model

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (TLS 1.2+) in production |
| Auth | JWT (HS256, 8h expiry) |
| Passwords | bcrypt, cost factor 12 |
| Input | express-validator on all POST/PUT |
| Rate limiting | express-rate-limit (100 req/15min per IP) |
| CORS | Whitelist: frontend origin only |
| API Keys | Stored in .env, never in DB or code |

---

## 7. Logging Strategy

**Log Format (JSON structured):**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO | WARN | ERROR",
  "type": "user_action | failover | api_call | error",
  "user": "admin1",
  "ip": "192.168.1.1",
  "action": "bgp_switch",
  "detail": "Switched from PRIMARY to SECONDARY",
  "duration_ms": 145
}
```

**Log Files:**

```
/logs/
  app.log          → General application log
  failover.log     → All failover/recovery events
  access.log       → HTTP request log
  error.log        → Error-only stream
```

---

## 8. Environment Configuration

```env
# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=<random-256bit>
JWT_EXPIRY=8h

# MikroTik defaults
MIKROTIK_DEFAULT_PORT=8728

# External APIs
IPINFO_TOKEN=<token>

# Proxmox (per-node config stored in DB, not env)

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Cache
CACHE_TTL_SECONDS=600
```

---

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms (internal), < 2s (external API) |
| WebSocket message latency | < 100ms |
| Failover detection time | ≤ 25 seconds (5 pings × 5s) |
| Recovery trigger time | ≤ 5 minutes |
| Proxmox refresh rate | 2–5 seconds |
| BGP lookup cache hit | > 80% in steady state |

---

## 10. Deployment

```
/project
  server.js           ← Entry point (node server.js)
  .env                ← Environment variables
  package.json

  Recommended: PM2 process manager
  pm2 start server.js --name nod --watch

  Reverse proxy: Nginx → localhost:3000
  SSL: Let's Encrypt / Certbot
```
