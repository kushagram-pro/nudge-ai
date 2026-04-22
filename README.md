# NudgeAI v1.0.0  
### Notification Decision Intelligence API

NudgeAI is a multi-tenant SaaS backend that helps companies optimize when and whether to send notifications based on user behavior.

Instead of blindly sending notifications, NudgeAI analyzes user activity and returns intelligent decisions that improve engagement and retention.

---

## 🚀 Overview

Modern applications send notifications without context, leading to low engagement and user fatigue.

NudgeAI solves this by acting as a **decision intelligence layer**:

- Predicts optimal send time
- Avoids sending at bad moments
- Improves user engagement using behavioral signals

---

## 🧠 Core Idea

Companies integrate with a single API:

POST /decide

Input:
{
  "user_id": "u123",
  "event_history": [],
  "message": "50% off on your next order"
}

Output:
{
  "status": "success",
  "message": "Decision generated",
  "data": {
    "should_send": true,
    "best_time": "2026-04-22T19:00:00Z",
    "confidence": 0.82,
    "reason": "User active during this time window"
  }
}

---

## 🏗️ Architecture

- FastAPI (API layer)
- SQLAlchemy (ORM)
- SQLite / PostgreSQL (database)
- Celery + Redis (async processing)
- Rule-based decision engine (extendable to ML)

---

## 🔑 Key Features

### 1. Multi-Tenant SaaS
- Each company has its own API key
- Data is isolated per tenant

### 2. Decision Engine
- Uses user activity to determine:
  - whether to send
  - when to send
- Avoids spamming active users
- Handles inactive users intelligently

### 3. Async Processing
- Celery workers handle background jobs
- Scalable architecture

### 4. Feedback Loop (Foundation)
- Tracks user interaction with notifications
- Enables future learning and optimization

### 5. Analytics
- Event distribution
- Notification stats
- Engagement metrics (extendable)

---

## 🔐 Authentication

All requests require an API key:

Authorization: Bearer YOUR_API_KEY

---

## 📦 API Endpoints

### POST /decide
Returns decision for notification delivery

### POST /feedback
Tracks user interaction

{
  "user_id": "u123",
  "notification_id": 10,
  "action": "clicked"
}

### GET /metrics
Returns engagement statistics

{
  "status": "success",
  "data": {
    "total_decisions": 1200,
    "click_rate": 0.31,
    "engagement_score": 0.68
  }
}

---

## 🧪 Running Locally

### 1. Install dependencies
pip install -r requirements.txt

### 2. Run API
uvicorn app.main:app --reload

### 3. Run Redis
redis-server

### 4. Start Celery worker
python -m celery -A app.scheduler.celery_app.celery_app worker --loglevel=info --pool=solo

---

## 🧠 Use Cases

- Food delivery apps (optimize order nudges)
- Streaming platforms (increase watch engagement)
- E-commerce (recover abandoned carts)
- EdTech (increase daily activity)

---

## 💡 Why NudgeAI?

Most systems focus on sending notifications.

NudgeAI focuses on **sending them at the right time**.

---

## 🚀 Roadmap

- ML-based prediction models
- A/B testing engine
- Multi-channel support (email, push, SMS)
- Advanced analytics dashboard
- Tenant-level performance insights

---

## 📌 Version

Current Version: **v1.0.0**

This version includes:
- Multi-tenant API
- Rule-based decision engine
- Async processing
- Basic analytics
- Feedback tracking

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Built by Kushagra Maheshwari

---

## ⭐ Final Note

This project is designed as a **production-ready foundation** for a SaaS product focused on user engagement optimization.

It demonstrates:
- Backend system design
- Async architecture
- Multi-tenant SaaS thinking
- Behavioral decision systems
