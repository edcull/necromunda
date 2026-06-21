# Necromunda Dominion Campaign Tracker

An interactive web app for tracking Necromunda Dominion Campaign progress. Multiple campaigns can be run simultaneously, each with their own arbitrator, gang rosters and territory map.

## Features

- **Interactive hive map** — territory and hideout nodes on a procedurally generated SVG map, draggable by the arbitrator
- **Territory ownership** — assign territories to gangs; map nodes colour-coded by controlling gang
- **Per-node custom labels** — arbitrators can rename any territory or hideout inline
- **Gang roster** — up to 8 gangs with name, icon, colour, type, rating and reputation
- **Campaign configuration** — sector/campaign name, player count, territories in play, gang details
- **Dominion Campaign Cycles** — full 7-phase cycle tracker (Occupation ×3, Downtime, Takeover ×3):
  - Challenge creation with challenger, defender and staked territory
  - Territory locking while a challenge is pending
  - Result recording (win/refuse/draw) with automatic territory ownership update
  - Post-game gang rating and reputation update prompts
  - Challenge order display (rating low → high) for cycles with fixed order
  - Arbitrators can edit or roll back to previous cycles
- **Cross-navigation** — territory cards link to their map node; gang names link to the hideout drawer
- **Mobile-first layout** — full touch pan/zoom map with minimap HUD, collapsible gang legend, hold-to-drag node repositioning for arbitrators
- **Multi-campaign** — campaigns are independent; each has its own arbitrator account

## Stack

- **Node.js** + **Express** — HTTP server on port 3001
- **SQLite** (via `better-sqlite3`) — persists arbitrators and campaign state
- **Vanilla JS** — no front-end framework; single-page app with fetch API calls
- **bcrypt** — password hashing for arbitrator accounts
- **express-session** — cookie-based sessions backed by SQLite

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:3001/necromunda`.

For development with auto-reload:

```bash
npm run dev
```

## Data

Campaign state and arbitrator accounts are stored in `./data/necromunda.db`. This directory is created automatically on first run and is excluded from version control.

## Deployment

### Systemd service

Create `/etc/systemd/system/necromunda.service`:

```ini
[Unit]
Description=Necromunda Campaign Tracker
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/necromunda
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable necromunda
sudo systemctl start necromunda
```

### GitHub Actions

The repo includes `.github/workflows/deploy.yml` for automated deployment via a self-hosted runner. On push to `main`, it checks out the code, runs `npm ci`, and restarts the systemd service.

You'll need a self-hosted GitHub Actions runner set up on your Pi. See [GitHub docs](https://docs.github.com/en/actions/hosting-your-own-runners) for setup instructions.

The runner needs passwordless sudo for the restart command:

```
pi ALL=(ALL) NOPASSWD: /bin/systemctl restart necromunda
```

### Nginx

See `nginx/necromunda.conf` for the proxy configuration. Add it inside your `server {}` block in `/etc/nginx/sites-available/default` (or equivalent):

```nginx
location /necromunda {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Security Note

The session secret is hardcoded as `'CHANGE_ME_IN_PRODUCTION'` in `server/index.js`. Set it to a strong random string before deploying publicly (use an environment variable or config file outside the repo).


- **Node.js** + **Express** — HTTP server on port 3001
- **SQLite** (via `better-sqlite3`) — persists arbitrators and campaign state
- **Vanilla JS** — no front-end framework; single-page app with fetch API calls
- **bcrypt** — password hashing for arbitrator accounts
- **express-session** — cookie-based sessions backed by SQLite

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:3001/necromunda`.

For development with auto-reload:

```bash
npm run dev
```

## Data

Campaign state and arbitrator accounts are stored in `./data/necromunda.db`. This directory is created automatically on first run and is excluded from version control.

## Deployment

### Systemd service

Create `/etc/systemd/system/necromunda.service`:

```ini
[Unit]
Description=Necromunda Campaign Tracker
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/necromunda
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable necromunda
sudo systemctl start necromunda
```

### GitHub Actions

The repo includes `.github/workflows/deploy.yml` for automated deployment via a self-hosted runner. On push to `main`, it checks out the code, runs `npm ci`, and restarts the systemd service.

You'll need a self-hosted GitHub Actions runner set up on your Pi. See [GitHub docs](https://docs.github.com/en/actions/hosting-your-own-runners) for setup instructions.

The runner needs passwordless sudo for the restart command:

```
pi ALL=(ALL) NOPASSWD: /bin/systemctl restart necromunda
```

### Nginx

See `nginx/necromunda.conf` for the proxy configuration. Add it inside your `server {}` block in `/etc/nginx/sites-available/default` (or equivalent):

```nginx
location /necromunda {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Security Note

The session secret is hardcoded as `'CHANGE_ME_IN_PRODUCTION'` in `server/index.js`. Set it to a strong random string before deploying publicly (use an environment variable or config file outside the repo).
