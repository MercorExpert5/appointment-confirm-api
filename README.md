# Appointment Confirmation API

A small Express + SQLite service that stores clinic appointments and places
an automated confirmation call to each customer.

## Setup

```bash
npm install
npm start      # runs on http://localhost:3000
npm test       # runs the test suite (Node's built-in test runner)
```

Requires Node.js 20 or later.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/appointments` | Create an appointment (`customer`, `phone`, `startsAt`) |
| `GET` | `/appointments/:id` | Get an appointment (phone is masked) |
| `GET` | `/appointments/:id/calls` | List calls placed for an appointment |
| `POST` | `/appointments/:id/confirm-call` | Place the confirmation call |

### Statuses

- `pending`: created, no call placed yet
- `called`: confirmation call placed

The telephony provider is simulated in `src/dialer.js` with realistic
network latency.
