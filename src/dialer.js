// Stand-in for the telephony provider. In production this calls the
// provider's REST API; here it simulates network latency and returns a
// provider reference for the placed call.

function createFakeDialer({ minDelayMs = 20, maxDelayMs = 80, failFor = [] } = {}) {
  let counter = 0;
  const placed = [];

  return {
    placed,

    async placeCall(phone, message) {
      const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (failFor.includes(phone)) {
        const err = new Error('Provider rejected the call');
        err.code = 'PROVIDER_ERROR';
        throw err;
      }

      counter += 1;
      const ref = `call_${Date.now()}_${counter}`;
      placed.push({ ref, phone, message });
      return { ref };
    },
  };
}

module.exports = { createFakeDialer };
