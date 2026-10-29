const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./helpers');

describe('appointments', () => {
  let t;
  beforeEach(async () => { t = await startTestServer(); });
  afterEach(async () => { await t.close(); });

  test('creates an appointment with a masked phone number', async () => {
    const res = await t.request('POST', '/appointments', {
      customer: 'Ada Obi',
      phone: '+447700900123',
      startsAt: '2026-11-02T10:30:00Z',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'pending');
    assert.equal(res.body.phone, '*********0123');
  });

  test('rejects an appointment with missing fields', async () => {
    const res = await t.request('POST', '/appointments', { customer: 'Ada Obi' });
    assert.equal(res.status, 400);
  });

  test('returns 404 for an unknown appointment', async () => {
    const res = await t.request('GET', '/appointments/999');
    assert.equal(res.status, 404);
  });
});

describe('confirm-call', () => {
  let t;
  afterEach(async () => { await t.close(); });

  test('places one call and marks the appointment as called', async () => {
    t = await startTestServer();
    const appt = await t.createAppointment();

    const res = await t.request('POST', `/appointments/${appt.id}/confirm-call`);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'called');
    assert.ok(res.body.providerRef);

    const calls = await t.request('GET', `/appointments/${appt.id}/calls`);
    assert.equal(calls.body.count, 1);
    assert.equal(t.dialer.placed.length, 1);
  });

  test('returns 409 when the appointment has already been called', async () => {
    t = await startTestServer();
    const appt = await t.createAppointment();

    await t.request('POST', `/appointments/${appt.id}/confirm-call`);
    const second = await t.request('POST', `/appointments/${appt.id}/confirm-call`);

    assert.equal(second.status, 409);
    assert.equal(t.dialer.placed.length, 1);
  });

  test('returns 404 when confirming an unknown appointment', async () => {
    t = await startTestServer();
    const res = await t.request('POST', '/appointments/999/confirm-call');
    assert.equal(res.status, 404);
  });

  test('leaves the appointment pending and retryable when the provider fails', async () => {
    t = await startTestServer({ failFor: ['+447700900999'] });
    const appt = await t.createAppointment({ phone: '+447700900999' });

    const res = await t.request('POST', `/appointments/${appt.id}/confirm-call`);
    assert.equal(res.status, 502);

    const after = await t.request('GET', `/appointments/${appt.id}`);
    assert.equal(after.body.status, 'pending');

    const calls = await t.request('GET', `/appointments/${appt.id}/calls`);
    assert.equal(calls.body.count, 0);
  });
});

describe('concurrent confirm-call', ()=>{
  test('two simultaneous requests only place one call', async ()=>{
    const t=await startTestServer();
    const appt = await t.createAppointment();

    const resutls =await Promise.all([
      t.request('POST', `/appointments/${appt.id}/confirm-call`),
      t.request('POST', `/appointments/${appt.id}/confirm-call`),
    ]);

    const statuses =resutls.map((r)=>r.status).sort();
    assert.deepEqual(statuses,[200,409])

    const calls = await t.request('GET', `/appointments/${appt.id}/calls`);
    assert.equal(calls.body.count,1);
    assert.equal(t.dialer.placed.length,1);

    await t.close();

  })
})
