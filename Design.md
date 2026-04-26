# Design.md — Network Operations Dashboard

## 1. Design Philosophy

The NOD UI follows the **AdminLTE dark dashboard** paradigm: a fixed left sidebar, a top navbar, and a fluid content area. Every design decision prioritizes:

- **Information density** — operators need to see many metrics at once without scrolling
- **Status clarity** — critical states (DOWN, WARNING, FAILOVER) must be unmissable
- **Operational speed** — common actions (BGP switch, tunnel toggle) must be ≤ 2 clicks
- **Consistency** — same color/icon/status language everywhere

---

## 2. Color System

### Base Palette (CSS Custom Properties)

```css
:root {
  /* Backgrounds */
  --bg-body:          #0d1117;   /* Main body/page background */
  --bg-sidebar:       #161b22;   /* Sidebar background */
  --bg-card:          #1c2128;   /* Card/panel background */
  --bg-card-header:   #21262d;   /* Card header strip */
  --bg-input:         #161b22;   /* Form input background */
  --bg-table-row:     #1c2128;   /* Table row background */
  --bg-table-hover:   #21262d;   /* Table row hover */
  --bg-table-stripe:  #1a1f26;   /* Alternating stripe */

  /* Borders */
  --border-color:     #30363d;   /* Default border/divider */
  --border-focus:     #58a6ff;   /* Input focus ring */

  /* Text */
  --text-primary:     #e6edf3;   /* Main body text */
  --text-secondary:   #8b949e;   /* Labels, metadata */
  --text-muted:       #484f58;   /* Disabled, placeholder */
  --text-inverse:     #0d1117;   /* Text on colored backgrounds */

  /* Brand / Accent */
  --accent-primary:   #1a73e8;   /* Primary buttons, links, active states */
  --accent-primary-h: #1557b0;   /* Hover state */
  --accent-glow:      rgba(26, 115, 232, 0.15);

  /* Status Colors */
  --status-green:     #2ea043;   /* Healthy / UP / Established */
  --status-green-bg:  rgba(46, 160, 67, 0.12);
  --status-green-text:#3fb950;   /* Green text on dark bg */

  --status-red:       #da3633;   /* Down / Error / Failover */
  --status-red-bg:    rgba(218, 54, 51, 0.12);
  --status-red-text:  #f85149;

  --status-yellow:    #d29922;   /* Warning / Degraded / Active (BGP) */
  --status-yellow-bg: rgba(210, 153, 34, 0.12);
  --status-yellow-text:#e3b341;

  --status-blue:      #1a73e8;   /* Info / Idle states */
  --status-blue-bg:   rgba(26, 115, 232, 0.12);
  --status-blue-text: #58a6ff;

  --status-gray:      #484f58;   /* Unknown / Offline / Disabled */
  --status-gray-bg:   rgba(72, 79, 88, 0.20);
  --status-gray-text: #8b949e;

  /* Stat Card Colors (AdminLTE-style header strips) */
  --card-blue:        #1a73e8;
  --card-green:       #2ea043;
  --card-yellow:      #d29922;
  --card-red:         #da3633;
  --card-purple:      #8957e5;
  --card-teal:        #1abc9c;

  /* Sidebar */
  --sidebar-width:    260px;
  --sidebar-active:   rgba(26, 115, 232, 0.20);
  --sidebar-hover:    rgba(255, 255, 255, 0.05);
  --sidebar-text:     #8b949e;
  --sidebar-text-act: #e6edf3;

  /* Navbar */
  --navbar-height:    56px;
  --navbar-bg:        #161b22;
  --navbar-border:    #30363d;

  /* Shadows */
  --shadow-card:      0 2px 8px rgba(0,0,0,0.4);
  --shadow-modal:     0 8px 32px rgba(0,0,0,0.6);

  /* Transitions */
  --transition-fast:  0.15s ease;
  --transition-med:   0.25s ease;

  /* Border Radius */
  --radius-sm:        4px;
  --radius-md:        8px;
  --radius-lg:        12px;
}
```

---

## 3. Status Indicator System

Every status throughout the system uses a consistent badge/dot pattern.

### Status Dot (inline indicator)

```
●  Green  → UP / Established / Running
●  Red    → DOWN / Error / Stopped
●  Yellow → WARNING / Active (connecting) / Degraded
●  Blue   → IDLE / Info
●  Gray   → UNKNOWN / Disabled / N/A
```

### Status Badge (pill label)

```
┌──────────────┐
│ ● ESTABLISHED│   green bg-tint, green text, 4px radius
└──────────────┘

┌──────────────┐
│ ● DOWN       │   red bg-tint, red text
└──────────────┘

┌──────────────┐
│ ● WARNING    │   yellow bg-tint, yellow text
└──────────────┘
```

### Usage by Module

| Module | Green | Yellow | Red |
|--------|-------|--------|-----|
| BGP | Established | Active | Idle/Down |
| EOIP Tunnels | Enabled | — | Disabled |
| Proxmox Node | CPU < 70% | 70-90% | > 90% |
| Proxmox VM | Running | Paused | Stopped |
| Ping | < 50ms loss | Packet loss | Unreachable |
| Failover | PRIMARY | — | FAILOVER |

---

## 4. Typography

```css
/* Font Stack */
font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;

/* Type Scale */
--text-xs:   11px;   /* Labels, timestamps, badge text */
--text-sm:   12px;   /* Table data, secondary info */
--text-base: 14px;   /* Body text, default */
--text-md:   15px;   /* Card body */
--text-lg:   18px;   /* Section titles */
--text-xl:   22px;   /* Stat card numbers */
--text-2xl:  28px;   /* Page titles */
--text-3xl:  36px;   /* Large metric display */

/* Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

---

## 5. Layout Grid

### Shell Layout

```
┌─────────────────────────────────────────────────────────┐
│                     TOP NAVBAR (56px)                    │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│   SIDEBAR    │           CONTENT AREA                   │
│   (260px)    │        (fluid, min-width 0)               │
│   fixed      │        padding: 24px                     │
│              │                                           │
│              │                                           │
│              │                                           │
└──────────────┴──────────────────────────────────────────┘
```

### Content Area Grid

```css
/* Stat cards row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

/* Main content (chart + side panel) */
.content-row {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
}

/* Full-width tables/panels */
.full-row {
  grid-column: 1 / -1;
}

/* Responsive breakpoints */
@media (max-width: 1200px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .stats-row { grid-template-columns: 1fr; } .content-row { grid-template-columns: 1fr; } }
```

---

## 6. Component Specifications

### 6.1 Stat Card (AdminLTE-style)

```
┌─────────────────────────────────────┐
│  [colored top border strip, 4px]    │
│                                     │
│  LABEL TEXT              [ICON BOX] │
│  (12px, secondary)       (colored)  │
│                                     │
│  VALUE                              │
│  (36px, bold, white)                │
│                                     │
│  [sparkline/trend bar, 32px tall]   │
│─────────────────────────────────────│
│  [footer: "More info →"]            │
└─────────────────────────────────────┘
```

Properties:
- Card bg: `--bg-card`
- Border radius: `--radius-md`
- Top border: 4px solid `--card-{color}`
- Icon box: 56×56px, colored bg at 20% opacity, centered icon
- Shadow: `--shadow-card`

### 6.2 Data Table

```
┌─────────────────────────────────────────────────────────┐
│  Card Header: "Section Title"           [Action Button] │
├─────────┬─────────┬──────────┬──────────┬──────────────┤
│  PEER   │  REMOTE │    ASN   │  STATE   │    UPTIME    │  ← TH: 11px, uppercase, muted
├─────────┼─────────┼──────────┼──────────┼──────────────┤
│ peer-a  │10.0.0.1 │  AS64512 │● ESTAB.. │  2d 14h 03m  │  ← TD: 14px
├─────────┼─────────┼──────────┼──────────┼──────────────┤  ← stripe
│ peer-b  │10.0.0.2 │  AS64513 │● ACTIVE  │  00:05:13    │
└─────────┴─────────┴──────────┴──────────┴──────────────┘
```

Specs:
- Header row: `--bg-card-header`, 11px uppercase, letter-spacing 0.5px
- Row height: 44px
- Row border: 1px solid `--border-color`
- Alternating bg: `--bg-table-stripe`
- Hover: `--bg-table-hover`

### 6.3 Action Button

```css
/* Primary */
.btn-primary {
  background: var(--accent-primary);
  color: #fff;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-primary:hover { background: var(--accent-primary-h); }

/* Danger (BGP switch, force failover) */
.btn-danger {
  background: var(--status-red);
  color: #fff;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
```

### 6.4 Toggle Switch (Tunnel Enable/Disable)

```
OFF:  [○──────]  gray track, circle left
ON:   [──────●]  green track, circle right

Width: 44px, Height: 24px
Transition: 0.2s ease
Thumb: 20px circle, white
Track: 4px radius
```

### 6.5 Alert / Notification Banner

```
┌─────────────────────────────────────────────────┐
│ 🔴  FAILOVER ACTIVE — Switched to Secondary BGP  │   red bg-tint, left border 4px red
│     Triggered at 14:32:05 · Duration: 00:05:13   │
│                              [Restore Primary]   │
└─────────────────────────────────────────────────┘
```

### 6.6 BGP Tools Search Input

```
┌─────────────────────────────────────┬──────────┐
│  🔍  Enter ASN, IP, or Prefix...    │  SEARCH  │
└─────────────────────────────────────┴──────────┘

Placeholder examples shown below input:
"AS13335  ·  8.8.8.8  ·  1.1.1.0/24"
```

---

## 7. Chart Specifications

Using **Chart.js** for all charts.

### Line Chart (Ping Latency / CPU over time)

```javascript
{
  type: 'line',
  options: {
    responsive: true,
    backgroundColor: 'rgba(26, 115, 232, 0.08)',  /* Fill under line */
    borderColor: '#1a73e8',
    borderWidth: 2,
    pointRadius: 0,           /* No dots by default */
    pointHoverRadius: 4,
    tension: 0.4,             /* Smooth curves */
    grid: {
      color: 'rgba(48, 54, 61, 0.8)'  /* --border-color at 80% */
    },
    scales: {
      x: { display: true, tick: { color: '#8b949e', font: { size: 11 } } },
      y: { display: true, tick: { color: '#8b949e', font: { size: 11 } } }
    }
  }
}
```

### Gauge / Donut (CPU %, RAM %)

```javascript
{
  type: 'doughnut',
  options: {
    cutout: '75%',
    rotation: -90,
    circumference: 180,   /* Half donut */
    /* Center text plugin: shows percentage value */
  }
}
```

### Sparkline (Stat card mini chart)

```
Height: 32px, no axes, no labels
Single color line matching card accent
Area fill at 15% opacity
```

---

## 8. Icon System

Use **Font Awesome 6 Free** icons throughout.

| Element | Icon |
|---------|------|
| Dashboard | `fa-gauge-high` |
| BGP / Routing | `fa-route` |
| Tunnels | `fa-tunnel` / `fa-circle-nodes` |
| Proxmox / Servers | `fa-server` |
| BGP Tools | `fa-magnifying-glass-chart` |
| Users | `fa-users` |
| Logs | `fa-list-check` |
| Settings | `fa-gear` |
| Status UP | `fa-circle-check` |
| Status DOWN | `fa-circle-xmark` |
| Warning | `fa-triangle-exclamation` |
| CPU | `fa-microchip` |
| RAM | `fa-memory` |
| Network | `fa-network-wired` |
| Ping | `fa-signal` |
| Switch/Failover | `fa-shuffle` |
| Logout | `fa-right-from-bracket` |

---

## 9. Responsive Behavior

| Breakpoint | Sidebar | Stats Grid | Content |
|-----------|---------|-----------|---------|
| > 1200px | Fixed 260px | 4 cols | 2-col layout |
| 992–1200px | Fixed 220px | 2 cols | 2-col layout |
| 768–992px | Collapsible (overlay) | 2 cols | 1-col stack |
| < 768px | Hidden (hamburger toggle) | 1 col | 1-col stack |

On mobile, sidebar opens as a drawer overlay with semi-transparent backdrop.

---

## 10. Animation & Interaction

```css
/* Card appear */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card { animation: fadeInUp 0.3s ease both; }

/* Status dot pulse (when in FAILOVER state) */
@keyframes statusPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(218, 54, 51, 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(218, 54, 51, 0); }
}
.status-dot.critical { animation: statusPulse 1.5s infinite; }

/* Number counter (stat cards on load) */
/* Use CountUp.js or vanilla JS requestAnimationFrame */
```

---

## 11. Form & Input Styling

```css
.form-control {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 14px;
  transition: border-color var(--transition-fast);
}
.form-control:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
```
