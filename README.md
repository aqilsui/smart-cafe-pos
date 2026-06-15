# ☕ Smart Cafe POS System

A modern, AI-powered Point-of-Sale (POS) system built for **F&B / Cafe businesses** — handling the full dining lifecycle from seating to payment, with a real-time kitchen display, mid-meal order edits, and intelligent AI features.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | Spring Boot 3.2 (Java 17) |
| Database | PostgreSQL 16 |
| AI/NLP | Rule-based NLP + ETA Predictor + Recommender |

---

## ✨ Features

### Core Workflows
- 🪑 **Table Management** — Visual table grid with live status (Vacant / Occupied / Paying)
- 📋 **Order Pad** — Category-browsed menu, add/remove/edit items mid-meal
- 🍳 **Kitchen Display System (KDS)** — Real-time queue with bottleneck alerts
- 💳 **Flexible Billing** — Full pay, equal split, or itemized split per person

### AI Features
- 🎤 **Voice/Text Order Parser** — Natural language input (e.g. _"2 lattes for table 5"_) mapped to menu items
- ⏱️ **ETA Predictor** — Estimates preparation time based on kitchen load
- 🔁 **Cross-Sell Recommender** — Suggests complementary items based on current cart

---

## 🛠️ Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 16 (database: `cafe_pos`, user: `postgres`, password: `postgres`)

### 1 — Start the Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

Backend will be available at: `http://localhost:8085`

### 2 — Start the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 📂 Project Structure

```
cafe-pos/
├── backend/               # Spring Boot application
│   └── src/main/java/com/cafe/pos/
│       ├── model/         # JPA entities
│       ├── repository/    # Spring Data repositories
│       ├── service/       # Business logic (Order, Kitchen, Payment, AI)
│       └── controller/    # REST API controllers
├── frontend/              # React + Vite application
│   └── src/
│       ├── components/    # UI components (Layout, TableGrid, OrderPad, KDS, BillSplitter)
│       ├── context/       # AppContext (global state + API calls)
│       └── index.css      # Dark glassmorphism design system
└── README.md
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | List all tables |
| POST | `/api/tables/{id}/seat` | Seat a table |
| POST | `/api/tables/{id}/vacate` | Vacate a table |
| POST | `/api/orders/table/{id}` | Start a new order |
| GET | `/api/orders/table/{id}/active` | Get active order |
| POST | `/api/orders/{id}/items` | Add item to order |
| PUT | `/api/orders/{id}/items/{itemId}` | Update item quantity |
| DELETE | `/api/orders/{id}/items/{itemId}` | Remove item |
| GET | `/api/kitchen/queue` | Get kitchen queue |
| GET | `/api/kitchen/metrics` | Get kitchen load metrics |
| PUT | `/api/kitchen/items/{id}/status` | Update item status |
| POST | `/api/payments/order/{id}/pay-full` | Full payment |
| POST | `/api/payments/order/{id}/pay-partial` | Partial payment |
| POST | `/api/payments/order/{id}/pay-items` | Itemized payment |
| POST | `/api/ai/parse` | Parse natural language order |
| POST | `/api/ai/eta` | Get estimated prep time |
| POST | `/api/ai/recommend` | Get menu recommendations |

---

## 📸 Screenshots

> Open `http://localhost:5173` after starting both services to explore the full POS system.

---

## 🤝 Contributing

This project was built as an assessment/demonstration system. Feel free to fork and expand with:
- Real ML-based NLP (OpenAI API / local LLM)
- Printer integration (receipt printing)
- Payment gateway (Stripe / PayPal)
- Multi-location / multi-device support

---

*Built with ☕ and Spring Boot.*
