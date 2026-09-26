# Halo Consultation Studio

An MVP implementation of the attached Halo Salon screen reference.

## Run locally

```bash
npm install
cp .env.example backend/.env
npm run db:up
npm run dev
```

Open `http://localhost:5173`. The default command runs the React frontend only. Use `npm run dev:all` later when Postgres and the NestJS API are connected.

The app works without an AI key. If Ollama is running locally, the report endpoint will use `OLLAMA_MODEL`; otherwise it returns a useful deterministic estimate based on the consultation inputs.
