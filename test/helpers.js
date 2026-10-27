const { openDb } = require('../src/db');
const { createFakeDialer } = require('../src/dialer');
const { createApp } = require('../src/app');

async function startTestServer(dialerOptions = {}) {
  const db = openDb(':memory:');
  const dialer = createFakeDialer(dialerOptions);
  const app = createApp({ db, dialer });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, body) {
    const res = await fetch(baseUrl + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  async function createAppointment(overrides = {}) {
    const res = await request('POST', '/appointments', {
      customer: 'Ada Obi',
      phone: '+447700900123',
      startsAt: '2026-11-02T10:30:00Z',
      ...overrides,
    });
    return res.body;
  }

  async function close() {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }

  return { baseUrl, dialer, request, createAppointment, close };
}

module.exports = { startTestServer };
