# Bug: some customers get two confirmation calls

**Reported by:** Clinic operations team
**Severity:** High (customer complaints, doubled telephony cost)

## What's happening

Since we connected the new booking dashboard, a handful of customers each
week say they received the appointment confirmation call twice, a few
seconds apart. The call logs confirm it: those appointments have two
entries in `/appointments/:id/calls`.

## What we know

- It only happens occasionally. Most appointments get exactly one call.
- The dashboard sometimes sends the "confirm call" request more than once
  when staff double-click the button, and the nightly batch job can also
  trigger calls for the same appointments at the same time.
- Clicking "confirm call" again a minute later correctly shows
  "Appointment is already called", so the duplicate check seems to work.

## Expected behaviour

Each appointment is called **at most once**, no matter how many
confirm-call requests arrive or how close together they are. Any extra
request should get a `409 Conflict` without placing a call.

If the telephony provider fails, the appointment must stay retryable.
