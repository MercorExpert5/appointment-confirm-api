const { openDb } = require('./db');
const { createFakeDialer } = require('./dialer');
const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;
const app = createApp({ db: openDb(), dialer: createFakeDialer() });

app.listen(port, () => {
  console.log(`Appointment confirmation API listening on http://localhost:${port}`);
});
