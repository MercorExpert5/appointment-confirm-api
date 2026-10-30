function createStore(db) {
  const insertAppt = db.prepare(
    'INSERT INTO appointments (customer, phone, starts_at) VALUES (?, ?, ?)'
  );
  const getAppt = db.prepare('SELECT * FROM appointments WHERE id = ?');
  const setStatusStmt = db.prepare(
    "UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?"
  );
  const insertCall = db.prepare(
    'INSERT INTO calls (appointment_id, provider_ref) VALUES (?, ?)'
  );
  const listCallsStmt = db.prepare(
    'SELECT * FROM calls WHERE appointment_id = ? ORDER BY id'
  );
//testing push
  return {
    createAppointment({ customer, phone, startsAt }) {
      const info = insertAppt.run(customer, phone, startsAt);
      return getAppt.get(info.lastInsertRowid);
    },

    getAppointment(id) {
      return getAppt.get(id);
    },

    setStatus(id, status) {
      setStatusStmt.run(status, id);
    },

    recordCall(appointmentId, providerRef) {
      insertCall.run(appointmentId, providerRef);
    },

    listCalls(appointmentId) {
      return listCallsStmt.all(appointmentId);
    },
  };
}

module.exports = { createStore };
