# NOD: Network Operations Dashboard [MVP Build]

A centralized, high-performance infrastructure management platform for ISPs and Network Engineers. NOD provides real-time visibility and automated control over BGP routing, EOIP tunnels, and Proxmox hypervisor clusters.

## 🚀 Purpose
The Network Operations Dashboard (NOD) solves the complexity of managing multi-vendor network infrastructure. It provides a unified "Single Pane of Glass" for monitoring system health and orchestrating critical network shifts during DDoS attacks or upstream failures.

## ✨ Core Features (MVP)
- **OLED Design System**: Modern, high-density minimalistic UI optimized for 24/7 NOC monitoring.
- **BGP Shifting Console**: A high-tech real-time stream for monitoring inbound connectivity and managing protected route failover.
- **Proxmox Analyzer**: Live performance dashboards (CPU, RAM, Disk, Net MB/s) for all PVE nodes with historical trend tracking.
- **BGP Intelligence Tools**: Integrated ASN and IP reputation lookups via IPinfo Lite API.
- **Failover Engine**: Automated ping-based state machine that detects upstream loss and orchestrates fallback routing.
- **Secure RBAC**: JWT-based authentication with role-based access control for Administrators and Staff.
- **Sandbox Mode**: Global simulation toggle to test failover logic and train operators without affecting live traffic.

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js, better-sqlite3
- **Frontend**: Vanilla JS (ES6+), CSS3 (Custom Variables), HTML5
- **Real-time**: WebSockets (ws)
- **Data Viz**: Chart.js
- **Network**: node-ping

## 🚦 Getting Started

### Prerequisites
- Node.js v18 or higher
- A modern web browser (Chrome/Edge recommended)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the provided credentials:
   ```env
   JWT_SECRET=your_random_secret
   IPINFO_TOKEN=your_token_here
   PRIMARY_PING_TARGET=8.8.8.8
   ```
4. Seed the initial admin account:
   ```bash
   node scripts/seedAdmin.js
   ```

### Running the App
Start the development server:
```bash
npm start
```
The dashboard will be available at `http://localhost:3000`.

## 🔐 Default Credentials
- **Username**: `admin`
- **Password**: `admin_password_2026`

## 🧪 Testing
Run the comprehensive 21-test suite:
```bash
npm test
```

---
*Built for high-reliability network environments.*
