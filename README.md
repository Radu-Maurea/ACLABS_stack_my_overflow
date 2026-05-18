# StackMyOverflow 🧠⚡

> Stack Overflow, but with a brain. AI-triage your questions before the crowd weighs in.

---

## What is it?

**StackMyOverflow** is a developer Q&A platform that blends community-driven answers with AI-assisted triage. When you post a question, **Grok** silently evaluates it first — if it's confident it can help, you get an instant AI response. If not, it steps aside and lets the community answer instead.

No hallucinated confidence. No AI noise when it doesn't know. Just smart routing.

---

## Features

- 🤖 **AI-First Triage** — Every question is automatically sent to Grok. It only responds if it's confident enough to help.
- 🙅 **Graceful Silence** — If Grok isn't sure, it says nothing. Your question goes straight to the community.
- 👥 **Community Answers** — Other developers can post, vote on, and accept answers just like Stack Overflow.
- 🏷️ **Tags & Search** — Filter questions by topic, language, or framework.
- 🔺 **Voting System** — Upvote/downvote questions and answers to surface the best content.
- ✅ **Accepted Answers** — Question authors can mark the best answer.
- 👤 **User Profiles** — Reputation system, badges, and answer history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| AI | Grok API (xAI) |
| Auth | JWT + OAuth (GitHub) |
| Deployment | Docker + Railway / Vercel |

---

## How the AI Triage Works

```
User posts question
        │
        ▼
  Grok evaluates question
        │
   ┌────┴────┐
   │         │
Confident  Not sure
   │         │
   ▼         ▼
AI answer  No AI response
posted     Question goes to community
```

Grok is prompted to assess its own confidence before answering. The prompt instructs it to respond **only** if it can give a reliable, specific answer — otherwise it returns a structured signal to skip. This avoids the "AI makes something up" problem common to naive integrations.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 15
- A [Grok API key](https://x.ai) from xAI

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/stackmyoverflow.git
cd stackmyoverflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stackmyoverflow

# Auth
JWT_SECRET=your_jwt_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI
GROK_API_KEY=your_grok_api_key
GROK_MODEL=grok-3

# App
PORT=3000
NODE_ENV=development
```

### Run Locally

```bash
# Run database migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

App will be available at `http://localhost:3000`.

---

## Project Structure

```
stackmyoverflow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── api/            # API client functions
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── services/
│   │   └── grok.ts         # AI triage service
│   ├── models/             # Database models
│   └── middleware/         # Auth, validation, etc.
├── db/
│   └── migrations/         # SQL migration files
├── docker-compose.yml
└── README.md
```

---

## Contributing

Contributions are welcome! Here's how to get involved:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to your branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for code style guidelines and the PR process.

---

## Roadmap

- [ ] Real-time notifications (WebSockets)
- [ ] Markdown + code block rendering in questions/answers
- [ ] AI answer regeneration on request
- [ ] Comment threads on answers
- [ ] Moderator tools
- [ ] Dark mode
- [ ] Mobile app (React Native)

---

## License

MIT © 2025 StackMyOverflow Contributors

---

<p align="center">Built by developers, for developers — with a little AI on the side.</p>
