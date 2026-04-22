# NudgeAI — Context-Aware Notification Engine (SaaS)

## Problem

Modern applications send notifications without considering user context, behavior, or timing.

This leads to:

* Notification fatigue
* Low engagement rates
* Poor user experience

Existing systems rely on:

* Fixed schedules
* Generic messaging
* No feedback-based optimization

---

## Solution

NudgeAI is a multi-tenant SaaS backend that intelligently decides:

If → When → What to notify a user

It uses event-driven architecture and behavioral modeling to optimize notification delivery for higher engagement.

---

## Core Features

* Event Ingestion System — Tracks user activity in real time
* Behavior Modeling — Builds user engagement profiles
* Smart Scheduling Engine — Optimizes notification timing
* Analytics API — Measures engagement and performance
* Feedback Loop — Continuously improves decisions
* Multi-Tenant Architecture — Supports multiple applications

---

## Architecture Overview

```text
Client App
   │
   ├── POST /events ───────────────► Event Ingestion API
   │                                  │
   │                                  ▼
   │                          User Behavior Model
   │                                  │
   ├── POST /notify ───────────────► Decision Engine
                                      │
                                      ▼
                               Scheduler (Queue)
                                      │
                                      ▼
                              Notification Worker
                                      │
                                      ▼
                              Notification Delivery
                                      │
                                      ▼
                               Feedback Loop (events)
```

---

## Tech Stack

* Backend: FastAPI (Python)
* Queue: Redis + Celery
* Database: PostgreSQL
* Containerization: Docker
* AI/ML (Phase 2+): Scikit-learn or PyTorch

---

## API Design

### 1. Track User Events

```http
POST /events
```

```json
{
  "user_id": "u123",
  "event": "app_open",
  "timestamp": "2026-04-19T10:00:00"
}
```

---

### 2. Send Notification Request

```http
POST /notify
```

```json
{
  "user_id": "u123",
  "message": "Complete your workout today!",
  "type": "reminder"
}
```

---

### 3. Get User Profile Insights

```http
GET /user/{id}/profile
```

---

### 4. Analytics

```http
GET /analytics/engagement
```

---

## Decision Engine Logic

### Phase 1 (Rule-Based)

* Send only during user active hours
* Avoid inactive users
* Limit daily notifications

### Phase 2 (ML-Based)

* Predict probability of engagement
* Optimize timing based on historical behavior

---

## Database Schema

* users
* tenants
* events
* notifications
* engagement_logs

---

## Data Flow

1. Client sends user events to `/events`
2. System updates behavior model
3. Client requests notification via `/notify`
4. Decision engine determines optimal timing
5. Job is queued and processed asynchronously
6. Notification is sent
7. User interaction is tracked and fed back into the system

---

## SaaS Capabilities

* Multi-tenant architecture
* Rate limiting per tenant
* Usage tracking (notifications per user)
* Extensible pricing model (Free and Pro tiers)

---

## Getting Started

### Frontend Dashboard

The React dashboard lives at the repository root and connects to the FastAPI API at `http://localhost:8000` by default.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Demo company login:

```text
Email: demo@nudgeai.dev
Password: password
API key: nudge_demo_api_key_123
```

To target another backend URL, create `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Notification Decision API

Companies can sign up, log in, and use their tenant API key for the decision API.

```http
POST /companies/signup
POST /companies/login
POST /decide
POST /feedback
GET /metrics
GET /mock/user
```

Authenticated API requests must include:

```text
Authorization: Bearer <API_KEY>
```

Example decision request:

```json
{
  "user_id": "demo_user_001",
  "event_history": [
    {
      "event": "app_open",
      "timestamp": "2026-04-22T08:40:00Z"
    }
  ],
  "message": "Your personalized workout plan is ready."
}
```

### 1. Clone the repository

```bash
git clone https://github.com/kushagram-pro/nudge-ai.git
cd nudge-ai
```

### 2. Run with Docker

```bash
docker-compose up --build
```

### 3. Access API

```
http://localhost:8000/docs
```

---

## Example Use Case

A fitness application integrates NudgeAI.

Instead of sending reminders at fixed times, the system:

* Learns when the user is most active
* Sends notifications at optimal times
* Improves engagement probability

---

## Roadmap

* Event ingestion system
* Rule-based decision engine
* Asynchronous notification scheduler
* ML-based engagement prediction
* Reinforcement learning optimization
* Dashboard interface
* A/B testing engine

---

## Future Improvements

* Real-time decision engine
* Cross-channel notifications (email, push, SMS)
* Personalization using embeddings
* Multi-language support

---

## Resume Description

Built a multi-tenant SaaS backend that optimizes notification delivery using event-driven architecture, behavioral modeling, and intelligent scheduling.

---

## License

MIT License

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss.

---

## Note

This project demonstrates:

* Backend system design
* Scalable architecture
* SaaS fundamentals
* Applied AI in a production-oriented system
"# nudge-ai" 
