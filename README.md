
# 🧠 MinDrift – Emotion-Based Chat & AI Diary Web App

> ITM519 Term Project – Full-Stack JavaScript RESTful Web Application

## TEAM MinDrift
[21102033 Kwon Daehoon](https://github.com/mmuhunn/)<br>
[21102052 Lee Jeongyun](https://github.com/itisyijy/)<br>
[21102056 Joo Youngjin](https://github.com/J0725/)<br>

## 📌 Project Overview

**MinDrift** is an AI-powered web application that enables users to reflect on their day through emotion-centered conversations. Based on this interaction, a personalized diary is automatically generated.  
Users engage in expressive dialogue and receive empathic feedback, allowing GPT to summarize their emotional flow and create a diary entry.

---

## 🛠️ Technology Stack

### Backend
- **Node.js**, **Express.js**
- **SQLite3** (file-based RDBMS)
- **OpenAI GPT-4o-mini** (chat & diary generation)
- **JWT** authentication (`jsonwebtoken`)
- **Bcrypt**: password hashing
- **CORS**, **Helmet**: security measures
- **node-cron**: scheduled message cleanup

### Frontend
- **React** (Next.js framework)
- **Tailwind CSS**, **TypeScript**
- **Lucide Icons** (for archive page)

---

## 🌐 Deployment Info

- **Frontend**: Vercel
- **Backend + DB**: Railway
- **GitHub**: Fully CI/CD integrated via repository connections

---

## 🔐 Security Features

- JWT-based access control
- Password hashing via bcrypt
- Output sanitization (`sanitize-html`) to prevent XSS
- CORS configuration with credentials
- HTTP security headers via Helmet

---

## 📁 Database Schema

| Table    | Primary Key | Foreign Key           | Fields                                  |
|----------|-------------|------------------------|------------------------------------------|
| users    | id          | -                      | user_id, username, password, created_at |
| messages | id          | user_id → users(id)    | role, content, created_at               |
| diaries  | id          | user_id → users(id)    | content, summary, created_at            |

---

## 📮 RESTful API Endpoints

### Auth (/auth)
| Method | Endpoint    | Description                  |
|--------|-------------|------------------------------|
| POST   | /register   | Register a new user          |
| POST   | /login      | Log in and receive JWT token |
| GET    | /me         | Retrieve current user info   |
| PUT    | /username   | Update username              |

### Chat (/api)
| Method | Endpoint    | Description                            |
|--------|-------------|----------------------------------------|
| POST   | /chat       | Send user message, receive GPT reply   |
| GET    | /messages   | Retrieve all user chat history         |

### Diary (/api/diary)
| Method | Endpoint                      | Description                                       |
|--------|-------------------------------|---------------------------------------------------|
| POST   | /diary                        | Generate diary from user input                   |
| POST   | /diary/from-history           | Generate diary from chat history                 |
| GET    | /diary/archive?date=YYYY-MM-DD | Get diary and messages for specific date         |
| GET    | /diary/dates                  | Get all dates with diary entries                 |
| GET    | /diary/id-by-date             | Get diary ID for specific date (for deletion)    |
| DELETE | /diary/:id                    | Delete diary entry by ID                         |

---

## ✨ Core Features

| Feature                         | Description                                         | Status |
|----------------------------------|-----------------------------------------------------|--------|
| 🧠 Emotion-based GPT chat        | Empathic dialogue using GPT-4o-mini                | ✅     |
| 📓 AI diary generation           | Diary automatically generated from conversations   | ✅     |
| 📁 Diary archive & management    | View, delete, and browse diary entries             | ✅     |
| 🔐 JWT authentication system     | User login and protected access                    | ✅     |
| 🕓 Daily message reset           | Clears chat log at 4:00 AM daily                   | ✅     |

---

## 🎨 Frontend Summary

- **Pages Implemented**:
  - Login Page
  - Signup Page
  - Chat Page
  - Archive Page (List + Detail)
  - Username Edit Feature
- **Auth State**: JWT-based session persisted via `localStorage`

---

## 📂 Server Directory Structure

```bash
server/
├── __tests__/
│   ├── auth.test.js
│   ├── chat.test.js
│   ├── diary.test.js
│   ├── messages.test.js
│   ├── user.test.js
│   └── archive.test.js
├── auth/
│   └── middleware.js
├── db/
│   ├── db.js
│   ├── db.memory.js
│   └── index.js
├── public/
│   └── demo/
│       ├── demo.html
│       └── demo.js
├── routes/
│   ├── auth.js
│   ├── chat.js
│   └── diary.js
├── .env, .env.example, .env.setup.js
├── app.js
├── cron.js
├── jest.config.js
├── users.db
```

---

## 🧪 Testing

**Please execute `npm install` before testing at `server/` and `client/`**

- **Jest-based test suite implemented**
- Located in `__tests__` with route-specific tests
- Ensure `.env` includes valid OpenAI API key for test success
- Execute `npm run test` or `npm run test:coverage` at `server/`. (Details in `server/coverage/lcov-report/index.html`)
- GitHub Action is implemented.
- Tech-demo webpage for implementing functions in practice. Please execute `npm run dev` and access to [`http://localhost:8080/demo.html`](http://localhost:8080/demo.html).

---

## 🔮 Future Development Ideas

- Emotion trend analytics and visualization
- Multi-language support for UI & GPT
- Export diary to PDF/Markdown
- Token usage optimization for GPT API