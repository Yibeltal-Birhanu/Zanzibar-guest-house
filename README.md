# Zanzibar Guest House & Restaurant

A full-stack direct-booking website for Zanzibar Guest House & Restaurant in Hawassa.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend runs through Vite and the booking API runs on port `4242`.

## Production

```bash
npm run build
npm start
```

Open `http://localhost:4242`.

## What works

- Availability lookup, based on selected dates and guest count
- Direct reservation form with date, capacity, conflict, and contact validation
- Booking confirmation reference and calculated stay total
- Contact-message form
- Local JSON data persistence in `server/data/` (replace this with a managed database before a public launch)

Room inventory and pricing live at the top of `server/index.js`.
