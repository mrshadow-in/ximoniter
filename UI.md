# UI.md — Network Operations Dashboard

## 1. Shell Layout (Global)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                               │
│ [☰] [NOD Logo]  Network Operations Dashboard    [🔔 3] [admin ▾]    │
├───────────────┬──────────────────────────────────────────────────────┤
│               │  breadcrumb: Home / Dashboard                         │
│  SIDEBAR      │──────────────────────────────────────────────────────│
│               │                                                       │
│  ○ Dashboard  │           PAGE CONTENT AREA                          │
│  ○ BGP Mgmt   │                                                       │
│  ○ Tunnels    │                                                       │
│  ○ Proxmox    │                                                       │
│  ○ BGP Tools  │                                                       │
│  ─────────    │                                                       │
│  ○ Users      │                                                       │
│               │                                                       │
│  [bottom]     │                                                       │
│  ○ Logs       │                                                       │
│  ○ Settings   │                                                       │
│  ○ Logout     │                                                       │
└───────────────┴──────────────────────────────────────────────────────┘
```

---

## 2. Sidebar Navigation

```
┌─────────────────────────┐
│  [≡]  NOD               │  ← logo + hamburger toggle
│─────────────────────────│
│  MAIN NAVIGATION        │  ← section label (10px, muted, uppercase)
│                         │
│  ⬡  Dashboard           │  ← active: blue left border + blue tint bg
│  ⇌  BGP Management      │
│  ⊙  Tunnel Manager      │
│  ⊞  Proxmox Analyzer    │
│  🔍 BGP Tools           │
│                         │
│  ADMINISTRATION         │  ← section label
│                         │
│  👥 User Management     │
│                         │
│  SYSTEM                 │
│                         │
│  📋 Event Logs          │
│  ⚙  Settings            │
│─────────────────────────│
│  [●] admin              │  ← current user chip
│  super_admin            │
│  [Logout]               │
└─────────────────────────┘
```

**Sidebar Item States:**

```css
/* Default */
.nav-item { color: #8b949e; padding: 10px 20px; }

/* Hover */
.nav-item:hover { background: rgba(255,255,255,0.05); color: #e6edf3; }

/* Active */
.nav-item.active {
  background: rgba(26,115,232,0.15);
  color: #58a6ff;
  border-left: 3px solid #1a73e8;
}
```

---

## 3. Page: Login

```
┌───────────────────────────────────────────────────┐
│                                                    │
│           [NOD Logo  /  Icon]                     │
│      Network Operations Dashboard                  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │              Sign In                         │  │
│  │                                              │  │
│  │  USERNAME                                    │  │
│  │  ┌────────────────────────────────────────┐ │  │
│  │  │  admin                                 │ │  │
│  │  └────────────────────────────────────────┘ │  │
│  │                                              │  │
│  │  PASSWORD                                    │  │
│  │  ┌────────────────────────────────────────┐ │  │
│  │  │  ••••••••                              │ │  │
│  │  └────────────────────────────────────────┘ │  │
│  │                                              │  │
│  │  [          Sign In          ]               │  │
│  │                                              │  │
│  │  ● Error message appears here                │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│           v1.0.0 · Powered by Node.js              │
└───────────────────────────────────────────────────┘
```

- Full-screen dark bg: `--bg-body`
- Card: 400px max-width, centered vertically and horizontally
- Error: red banner below form fields
- No registration link (admin creates users)

---

## 4. Page: Dashboard (Overview)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                              Home / Dashboard             │
│─────────────────────────────────────────────────────────────────────│
│                                                                      │
│  [FAILOVER ALERT BANNER — shown only when in FAILOVER state]        │
│  🔴 FAILOVER ACTIVE: Switched to Secondary BGP at 14:32:05          │
│                                              [Restore Primary]       │
│                                                                      │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐ │
│ │ BGP SESSIONS  │ │ ACTIVE TUNNELS│ │ PROXMOX NODES │ │  UPTIME  │ │
│ │           4   │ │           8   │ │           2   │ │  99.97%  │ │
│ │ ● 3 Estab     │ │ ● 7 Up        │ │ ● 2 Online    │ │ 30 days  │ │
│ │ [sparkline]   │ │ [sparkline]   │ │ [sparkline]   │ │[sparkline]│ │
│ │ More info →   │ │ More info →   │ │ More info →   │ │ More →   │ │
│ └─────[BLUE]────┘ └────[GREEN]────┘ └────[TEAL]─────┘ └──[PURPLE]┘ │
│                                                                      │
│ ┌───────────────────────────────────────┐ ┌────────────────────────┐│
│ │  PING LATENCY (last 60 min)           │ │  FAILOVER STATUS       ││
│ │                                       │ │                        ││
│ │  [Line chart - latency over time]     │ │  State: ● PRIMARY      ││
│ │   Target: 8.8.8.8                     │ │  Target: 8.8.8.8       ││
│ │   Avg: 14ms  Min: 8ms  Max: 45ms      │ │  Failures: 0           ││
│ │                                       │ │  Successes: 142        ││
│ │                                       │ │  Last Failover: N/A    ││
│ │                                       │ │  [Force Failover] btn  ││
│ └───────────────────────────────────────┘ └────────────────────────┘│
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │  RECENT EVENTS                                    [View All →]   │ │
│ │──────────────────────────────────────────────────────────────────│ │
│ │  2024-01-15 14:32:05  [FAILOVER]  Switched to secondary BGP      │ │
│ │  2024-01-15 08:15:00  [INFO]      admin logged in                │ │
│ │  2024-01-14 23:45:12  [RECOVERY]  Restored primary BGP           │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Page: BGP Management

```
┌─────────────────────────────────────────────────────────────────────┐
│  MikroTik BGP Management                   Home / BGP               │
│─────────────────────────────────────────────────────────────────────│
│                                                                      │
│ ┌──────────────────────────────┐  ┌─────────────────────────────┐   │
│ │  ROUTER SELECTOR             │  │  QUICK ACTIONS              │   │
│ │  ○ Router-Primary (Active)   │  │  [Switch to Secondary]      │   │
│ │  ● Router-Secondary          │  │  [Switch to Primary]        │   │
│ │  [Connect] button            │  │  [Refresh Status]           │   │
│ └──────────────────────────────┘  └─────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │  BGP PEERS                                    [Refresh ↻]        │ │
│ │──────────────────────────────────────────────────────────────────│ │
│ │  NAME          REMOTE IP    ASN       STATE         UPTIME       │ │
│ │  upstream-1    10.0.0.1     AS1299    ● ESTABLISHED  14d 03h     │ │
│ │  upstream-2    10.0.0.2     AS3356    ● ESTABLISHED  14d 03h     │ │
│ │  peer-ix       10.0.1.1     AS64512   ● ACTIVE       00:02:14    │ │
│ │  backup-bgp    192.168.1.1  AS65000   ○ IDLE         —           │ │
│ │──────────────────────────────────────────────────────────────────│ │
│ │  4 peers · 3 established · 56,432 active routes                  │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  ACTIVE ROUTES (Top 10)              [View All Routes →]       │   │
│ │────────────────────────────────────────────────────────────────│   │
│ │  PREFIX            NEXT-HOP      VIA PEER      AS-PATH         │   │
│ │  0.0.0.0/0         10.0.0.1      upstream-1    1299 ...        │   │
│ │  103.21.244.0/22   10.0.0.2      upstream-2    3356 13335 ...  │   │
│ └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Peer Action Row (on row hover):**
```
upstream-1  |  10.0.0.1  |  AS1299  |  ● ESTABLISHED  |  14d 03h  |  [Disable] [Details]
```

---

## 6. Page: Tunnel Manager

```
┌─────────────────────────────────────────────────────────────────────┐
│  EOIP Tunnel Manager                        Home / Tunnels           │
│─────────────────────────────────────────────────────────────────────│
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  COORDINATED SWITCH              Status: ● PRIMARY ACTIVE      │   │
│ │                                                                │   │
│ │  Perform simultaneous BGP + Tunnel failover/restore            │   │
│ │  [Coordinated Failover ▸]     [Coordinated Restore ▸]          │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  EOIP TUNNELS                              [Add Tunnel +]      │   │
│ │────────────────────────────────────────────────────────────────│   │
│ │  NAME          LOCAL IP      REMOTE IP     TUNNEL ID  STATUS   │   │
│ │  tunnel-pri    10.10.0.1     10.10.0.2     100        ●  [●]   │   │
│ │  tunnel-sec    10.10.0.1     10.10.0.3     101        ○  [○]   │   │
│ │  tunnel-mgmt   192.168.0.1   192.168.0.2   200        ●  [●]   │   │
│ │────────────────────────────────────────────────────────────────│   │
│ │  Tunnel [●] = enabled (green toggle)  [○] = disabled (gray)    │   │
│ └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

Toggle behavior: clicking the toggle immediately calls `POST /api/tunnels/eoip/switch` and shows a loading spinner in the cell until response.

---

## 7. Page: Proxmox Analyzer

```
┌─────────────────────────────────────────────────────────────────────┐
│  Proxmox Infrastructure                   Home / Proxmox             │
│─────────────────────────────────────────────────────────────────────│
│                                                                      │
│ ┌─────────────────────┐  ┌─────────────────────┐                    │
│ │  NODE: pve-main      │  │  NODE: pve-backup    │                   │
│ │  ● Online            │  │  ● Online            │                   │
│ │                      │  │                      │                   │
│ │  CPU  [▓▓▓░░] 34%    │  │  CPU  [▓▓░░░] 18%    │                   │
│ │  RAM  [▓▓▓▓░] 72%    │  │  RAM  [▓▓░░░] 41%    │                   │
│ │  Load  0.5 / 0.6     │  │  Load  0.2 / 0.3     │                   │
│ │                      │  │                      │                   │
│ │  VMs: 12 running     │  │  VMs: 6 running      │                   │
│ │  [View VMs ▾]        │  │  [View VMs ▾]        │                   │
│ └─────────────────────┘  └─────────────────────┘                    │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  VIRTUAL MACHINES — pve-main            Filter: [All ▾]        │   │
│ │────────────────────────────────────────────────────────────────│   │
│ │  VMID  NAME          STATUS    CPU    RAM      NET IN   OUT     │   │
│ │  101   router-vm     ● RUN     12%    1.2/4GB  1.2MB/s  2.1MB/s│   │
│ │  102   web-server    ● RUN     4%     0.8/2GB  0.4MB/s  0.8MB/s│   │
│ │  103   db-server     ● RUN     8%     6.1/8GB  0.1MB/s  0.1MB/s│   │
│ │  104   backup-vm     ■ STOP    0%     0/2GB    0        0      │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  CPU USAGE — pve-main (last 30 min)                            │   │
│ │  [Line chart — one line per major VM + node total]             │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────┐                                 │
│ │  NODE CONFIG (Admin)  [+ Add]    │                                 │
│ │  pve-main  · 10.0.0.10:8006 [✎][✗]│                               │
│ │  pve-bkup  · 10.0.0.11:8006 [✎][✗]│                               │
│ └──────────────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Progress Bar (CPU/RAM):**

```
[████████░░░░░░░░░░░░]  42%
   green (0-70%)  yellow (70-90%)  red (90-100%)
   transition between colors based on value
```

---

## 8. Page: BGP Tools

```
┌─────────────────────────────────────────────────────────────────────┐
│  BGP Intelligence Tools                    Home / BGP Tools          │
│─────────────────────────────────────────────────────────────────────│
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  🔍  AS13335  ·  8.8.8.8  ·  1.1.1.0/24         [SEARCH]      │   │
│ │  Type: ○ ASN    ○ IP Address    ○ Prefix/CIDR                  │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ← Results appear below after search →                               │
│                                                                      │
│ ┌──────────────────────────────────┐  ┌─────────────────────────┐   │
│ │  ASN INFORMATION                 │  │  ANNOUNCED PREFIXES     │   │
│ │  ASN:         AS13335            │  │─────────────────────────│   │
│ │  Name:        Cloudflare Inc.    │  │  1.1.1.0/24   IPv4      │   │
│ │  Country:     US 🇺🇸              │  │  1.0.0.0/24   IPv4      │   │
│ │  Organization: Cloudflare, Inc.  │  │  2606:4700::/32 IPv6    │   │
│ │                                  │  │  104.16.0.0/12 IPv4     │   │
│ │  Upstreams:                      │  │  [Show all 247...]      │   │
│ │  AS174 (Cogent)                  │  └─────────────────────────┘   │
│ │  AS3356 (Lumen)                  │                                 │
│ │  AS6461 (Zayo)                   │  ┌─────────────────────────┐   │
│ │                                  │  │  PEERS (sample)         │   │
│ │  IPv4 Prefixes:  247             │  │  AS2914  NTT            │   │
│ │  IPv6 Prefixes:  42              │  │  AS1299  Telia          │   │
│ └──────────────────────────────────┘  │  AS7018  AT&T           │   │
│                                       └─────────────────────────┘   │
│                                                                      │
│  ─── IP Lookup Result (shown when IP searched) ───                  │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  IP DETAIL PANEL                                               │   │
│ │  IP:         8.8.8.8                                           │   │
│ │  ASN:        AS15169 — Google LLC                              │   │
│ │  Country:    United States 🇺🇸                                  │   │
│ │  ISP:        Google LLC                                        │   │
│ │  Prefix:     8.8.8.0/24                                        │   │
│ │  Reverse DNS: dns.google                                       │   │
│ └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Loading State:** Search button shows spinner + "Looking up…" text. Cards skeleton-shimmer during load.

---

## 9. Page: User Management

```
┌─────────────────────────────────────────────────────────────────────┐
│  User Management                           Home / Users              │
│─────────────────────────────────────────────────────────────────────│
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │  USERS                                    [+ Add User]         │   │
│ │────────────────────────────────────────────────────────────────│   │
│ │  USERNAME       ROLE           LAST LOGIN        ACTIONS       │   │
│ │  admin          super_admin    2024-01-15 14:30  [✎] [—]       │   │
│ │  john.doe       admin          2024-01-14 09:15  [✎] [✗]       │   │
│ │  jane.smith     staff          2024-01-15 11:00  [✎] [✗]       │   │
│ │  viewer1        feature_user   Never             [✎] [✗]       │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Role Badge Colors:                                                  │
│  [super_admin] purple   [admin] blue   [staff] teal  [feature] gray │
└─────────────────────────────────────────────────────────────────────┘
```

**Add/Edit User Modal:**

```
┌──────────────────────────────────────────────┐
│  Add New User                             [✕] │
│──────────────────────────────────────────────│
│  USERNAME                                    │
│  [________________________]                  │
│                                              │
│  PASSWORD                                    │
│  [________________________]                  │
│                                              │
│  ROLE                                        │
│  [super_admin ▾]                             │
│                                              │
│  FEATURES (feature_user only)               │
│  ☐ BGP Tools (read-only)                    │
│  ☐ Ping Monitor (view)                      │
│                                              │
│            [Cancel]  [Create User]           │
└──────────────────────────────────────────────┘
```

---

## 10. Notification & Alert System

### Top Navbar Bell Icon

```
[🔔 3]  ← badge shows unread count

Dropdown on click:
┌──────────────────────────────────┐
│  NOTIFICATIONS            [✓ All] │
│──────────────────────────────────│
│  🔴 Failover active — 2m ago      │
│  🟡 BGP peer active (not estab)   │
│  🟡 Proxmox CPU >80% — pve-main   │
└──────────────────────────────────┘
```

### Toast Notifications (bottom-right)

```
┌────────────────────────────────────┐
│  ✅  BGP switched to secondary     │   green, auto-dismiss 5s
│                                    │
│  ❌  Cannot reach MikroTik router  │   red, persists until dismissed
│                                    │
│  ⚠️  High CPU detected on pve-main  │   yellow, auto-dismiss 8s
└────────────────────────────────────┘
```

---

## 11. Real-Time WebSocket UI Behavior

| Event Received | UI Action |
|----------------|-----------|
| `bgp_update` | Re-render BGP peer table rows (no full reload) |
| `failover_triggered` | Show red banner, pulse status dot, add event to log |
| `recovery_completed` | Hide red banner, update status to green |
| `proxmox_metrics` | Update CPU/RAM progress bars + sparklines |
| `ping_status` | Update latency chart + stat card |
| `tunnel_update` | Update toggle state in tunnel table |
| `ws_reconnecting` | Show yellow "Reconnecting..." banner in navbar |
| `ws_connected` | Hide reconnecting banner, flash green briefly |

**All table/card updates use DOM diffing (no full re-render) to avoid flickering.**

---

## 12. Page Loading & Skeleton States

Every card and table uses skeleton loaders while awaiting data:

```
Card skeleton:
┌─────────────────────────┐
│ [████████░░░] ███████   │  ← animated shimmer gradient
│ [░░░░░░░░░░░░░░░░░]     │
│ [░░░░░░░]               │
└─────────────────────────┘

Table skeleton:
│ ░░░░░░░░  ░░░░░░░░  ░░░░░░  ░░░░░░░░ │  ← 3-5 skeleton rows
```

Animation: `background: linear-gradient(90deg, #1c2128 25%, #21262d 50%, #1c2128 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;`

---

## 13. Accessibility & UX Details

- All interactive elements have `:focus-visible` ring (`box-shadow: 0 0 0 3px var(--accent-glow)`)
- Status colors always paired with icons/text (not color-only for accessibility)
- Confirmation modal required before: BGP switch, coordinated failover, user delete
- Loading state on all buttons during async operations (spinner icon + disabled)
- All tables are keyboard-navigable with row highlight on focus
- Tooltips on icon-only buttons (title attribute + CSS tooltip)
- Error states show inline below the relevant field, not only as toast

---

## 14. Confirmation Modal (Critical Actions)

```
┌──────────────────────────────────────────────────┐
│  ⚠️  Confirm Action                           [✕] │
│──────────────────────────────────────────────────│
│                                                  │
│  You are about to switch BGP to SECONDARY.       │
│  This will affect live network traffic.          │
│                                                  │
│  Type CONFIRM to proceed:                        │
│  [____________________]                          │
│                                                  │
│              [Cancel]   [Proceed →]              │
│                          (disabled until typed)  │
└──────────────────────────────────────────────────┘
```

Required for: BGP switch, coordinated failover/restore, force failover, delete user, delete Proxmox config.
