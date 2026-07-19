# Developer Guide

Setup guides for the parts of Footbolski that are easy to get wrong, written
after actually getting them wrong once. Each guide states the order that
worked, not the order the vendor's docs imply.

- [`whatsapp-twilio-setup.md`](./whatsapp-twilio-setup.md) — connecting a
  Twilio number to Meta's WhatsApp Business Platform, submitting message
  templates, and wiring Coolify.
- [`local-database-refresh.md`](./local-database-refresh.md) — pulling a
  fresh copy of production into the local Docker Postgres, updated for the
  tables added by the messaging migrations.

For everything else — architecture, coding conventions, deployment — see
[`/CLAUDE.md`](../CLAUDE.md) at the repo root.
