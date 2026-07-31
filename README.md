# nost-monitor-frontend

Monitor frontend for the Novel Observing Strategies Testbed (NOS-T). A single-page
web app (webpack + CesiumJS + Bootstrap + jQuery) that renders a 3D globe, shows a
live message log from the RabbitMQ broker, and provides simulation command dialogs
(Initialize / Start / Stop / Update).

It is one of three components deployed together by the
[`nost_rabbitmq_keycloak`](https://github.com/emmanuelgonz/nost_rabbitmq_keycloak)
compose stack (this app, `nost-monitor-backend`, and the RabbitMQ broker fronted by
the NASA Science Cloud–managed Keycloak).

## Authentication model

Each user signs in with their **own Keycloak account** (OAuth2 Authorization Code
flow via `keycloak-js`) against a **public** client — the browser holds **no client
secret**. The resulting per-user access token is then used two ways:

- **Broker:** opened as the password on the AMQP-over-WebSocket connection to the
  `rabbitmq_tcp_relay` (`wss://<host>:15670`); RabbitMQ authorizes each connection
  from the user's own roles.
- **Commands:** sent as a `Bearer` token to the backend API (`/api/...`), which
  validates it and acts on the user's behalf.

Token refresh is automatic (`keycloak.onTokenExpired` → `updateToken` →
`updateAmqpToken`). This design is the remediation for VDP-2723 — a prior version
baked a confidential client secret into the bundle. **Never reintroduce a client
secret or `client_credentials` grant in this app.**

## Configuration

`.env` in the repo root, **baked into the bundle at build time** by
`dotenv-webpack` (only vars referenced in `src/` are inlined). No secrets belong here.

| Variable | Example | Purpose |
|----------|---------|---------|
| `CESIUM_TOKEN` | `eyJ...` | CesiumJS Ion token (client-side, public) |
| `DEFAULT_KEYCLOAK_HOST` | `auth.sciencecloud.nasa.gov` | Keycloak host |
| `DEFAULT_KEYCLOAK_PORT` | `443` | Keycloak port (standard HTTPS) |
| `DEFAULT_KEYCLOAK_REALM` | `NOS-T` | Keycloak realm |
| `DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID` | `sos_nodejs` | Public login client |
| `DEFAULT_RABBITMQ_HOST` | `nost.smce.nasa.gov` | Broker host |
| `DEFAULT_RABBITMQ_RELAY_PORT` | `15670` | WebSocket-TCP relay port |
| `DEFAULT_RABBITMQ_EXCHANGE` | `nost` | Topic exchange |

In production these lock the login config; in dev builds they prefill an editable
login modal.

## Build & run

```bash
npm install
npm run build        # production bundle → dist/
npm start            # dev server on :5000
npm run start:built  # serve built dist/ on :8080
```

Docker (multi-stage: webpack build → nginx serving `dist/` on port 80):

```bash
docker build -t nost-monitor-frontend .
```

## Deployment

Built and served by the `nost_rabbitmq_keycloak` compose stack (build context
`../nost-monitor-frontend`), reachable at `https://nost.smce.nasa.gov/`. The Keycloak
realm setup (clients, scopes, mappers, per-user roles) is documented in that repo's
`KEYCLOAK_CLIENT_SCOPES_SETUP.md`; the redeploy cycle in its `REDEPLOY.md`.

## Notes / gotchas

- **`.env` is build-time.** Any config or code change requires a **rebuild**
  (`docker compose build nost-monitor-frontend`), not just a restart.
- **Cross-domain Keycloak.** Because Keycloak is on a different domain than the app,
  every `keycloak.init(...)` sets `checkLoginIframe: false`; otherwise the 3rd-party
  session-check iframe times out and init fails.
- After a rebuild, hard-refresh the browser (Ctrl/Cmd+Shift+R) to drop the cached
  `app.js`.
