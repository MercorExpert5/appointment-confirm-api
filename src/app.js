const express = require('express');
const { createStore } = require('./store');

function maskPhone(phone) {
  return phone.length > 4 ? `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}` : '****';
}

function toPublic(appt) {
  return {
    id: appt.id,
    customer: appt.customer,
    phone: maskPhone(appt.phone),
    startsAt: appt.starts_at,
    status: appt.status,
  };
}

function createApp({ db, dialer }) {
  const store = createStore(db);
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.post('/appointments', (req, res) => {
    const { customer, phone, startsAt } = req.body || {};
    if (!customer || !phone || !startsAt) {
      return res.status(400).json({ error: 'customer, phone and startsAt are required' });
    }
    const appt = store.createAppointment({ customer, phone, startsAt });
    res.status(201).json(toPublic(appt));
  });

  app.get('/appointments/:id', (req, res) => {
    const appt = store.getAppointment(Number(req.params.id));
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(toPublic(appt));
  });

  app.get('/appointments/:id/calls', (req, res) => {
    const appt = store.getAppointment(Number(req.params.id));
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    const calls = store.listCalls(appt.id).map((c) => ({
      providerRef: c.provider_ref,
      createdAt: c.created_at,
    }));
    res.json({ appointmentId: appt.id, count: calls.length, calls });
  });

  // Places the confirmation call for an appointment. Each appointment
  // should only ever be called once.
  app.post('/appointments/:id/confirm-call', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const appt = store.getAppointment(id);
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });

      if(!store.claimForDailling(id)){
        const current =store.getAppointment(id);
        return res.status(409).json({error:`Appointment is already ${current.status}`})
      };

      const message = `Hi ${appt.customer}, this is a reminder of your appointment at ${appt.starts_at}. Press 1 to confirm or 2 to reschedule.`;

      let result;
      try {
        result = await dialer.placeCall(appt.phone, message);
      } catch (err) {
        store.setStatus(id,'pending');
        return res.status(502).json({ error: 'Could not place call, please retry' });
      }

      store.recordCall(id, result.ref);
      store.setStatus(id, 'called');

      res.json({ ...toPublic(store.getAppointment(id)), providerRef: result.ref });
    } catch (err) {
      next(err);
    }
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
