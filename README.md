# Agent Backend

Backend API and AI agent orchestration service for the Agent platform.

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Google / OAuth Integrations
* AI Agent Orchestration

---

## Features

* User authentication
* Agent orchestration APIs
* Gmail / GitHub / Slack integrations
* OAuth handling
* MongoDB persistence

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Run Production

```bash
npm start
```

---

## Environment Variables

Create `.env` file:

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
OPENAI_API_KEY=your_key

GMAIL_CLIENT_ID=your_id
GMAIL_CLIENT_SECRET=your_secret
GMAIL_REDIRECT_URI=http://localhost:8000/auth/callback
```

---

## Deployment

Deployed separately from frontend.

Recommended Platforms:

* Render
* Railway
* Heroku

---

## License 

MIT
