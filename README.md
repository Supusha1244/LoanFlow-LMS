# 🏦 Loan Management System (LMS)

A full-stack Loan Management System built with **MERN + Next.js + TypeScript**.

## 🛠 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend    | Node.js + Express.js + TypeScript       |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT + bcrypt                            |
| File Upload| Multer (PDF/JPG/PNG, max 5MB)           |

---

## 📁 Project Structure

```
lms-project/
├── backend/
│   ├── src/
│   │   ├── config/        database.ts
│   │   ├── models/        User.ts, Loan.ts, Payment.ts
│   │   ├── routes/        auth, loans, payments, upload, users, dashboard
│   │   ├── middleware/    auth.ts (JWT + RBAC)
│   │   ├── utils/         bre.ts, loanCalc.ts
│   │   └── scripts/       seed.ts
│   ├── uploads/           (salary slips stored here)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── auth/login/    Login page
    │   │   ├── auth/register/ Register page
    │   │   ├── borrower/
    │   │   │   ├── dashboard/ Borrower's loan overview
    │   │   │   └── apply/     Multi-step loan application
    │   │   └── dashboard/
    │   │       ├── sales/         Sales module
    │   │       ├── sanction/      Sanction module
    │   │       ├── disbursement/  Disbursement module
    │   │       ├── collection/    Collection module
    │   │       └── admin/         Admin overview
    │   ├── components/
    │   ├── context/   AuthContext.tsx
    │   ├── lib/       api.ts, utils.ts
    │   └── types/     index.ts
    ├── .env.example
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/lms-project.git
cd lms-project
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed      # Creates all 6 role accounts
npm run dev       # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev       # Starts on http://localhost:3000
```

---

## 🔑 Login Credentials (after seed)

| Role         | Email                  | Password        |
|--------------|------------------------|-----------------|
| Borrower     | borrower@lms.com       | Borrower@123    |
| Admin        | admin@lms.com          | Admin@123       |
| Sales        | sales@lms.com          | Sales@123       |
| Sanction     | sanction@lms.com       | Sanction@123    |
| Disbursement | disburse@lms.com       | Disburse@123    |
| Collection   | collection@lms.com     | Collection@123  |

---

## 🔄 Loan Lifecycle

```
REGISTERED → APPLIED → SANCTIONED → DISBURSED → CLOSED
                    ↘ REJECTED
```

| Status     | Triggered By     | Action                         |
|------------|------------------|--------------------------------|
| applied    | Borrower         | Submits loan application       |
| sanctioned | Sanction Exec    | Approves the application       |
| rejected   | Sanction Exec    | Rejects with reason            |
| disbursed  | Disburse Exec    | Marks funds as released        |
| closed     | System (auto)    | When totalPaid == totalRepayment|

---

## 🧠 Business Rule Engine (BRE)

Runs **server-side** on `/api/loans/check-eligibility` and again on apply.

| Rule       | Condition                              |
|------------|----------------------------------------|
| Age        | Must be between 23 and 50 years        |
| Salary     | Monthly salary ≥ ₹25,000              |
| PAN        | Must match `^[A-Z]{5}[0-9]{4}[A-Z]$`  |
| Employment | Must NOT be unemployed                 |

---

## 💰 Loan Calculation

```
Simple Interest = (P × R × T) / (365 × 100)
Total Repayment = P + SI

Where:
  P = Principal (₹50,000 – ₹5,00,000)
  R = 12% per annum (fixed)
  T = Tenure in days (30–365)
```

---

## 🔐 Role-Based Access Control (RBAC)

| Role         | Access                                  |
|--------------|-----------------------------------------|
| borrower     | Apply portal only                       |
| sales        | Sales module (lead tracking)            |
| sanction     | Sanction module (approve/reject)        |
| disbursement | Disbursement module (disburse funds)    |
| collection   | Collection module (record payments)     |
| admin        | All modules + stats dashboard           |

RBAC enforced on **both frontend** (redirect) and **backend** (middleware returns 403).

---

## 🌐 Deployment

### Backend → Render.com
1. New Web Service → connect GitHub repo
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_here
   FRONTEND_URL=https://your-app.vercel.app
   PORT=5000
   ```
6. After first deploy, open Render Shell and run: `npm run seed`

### Frontend → Vercel
1. Import GitHub repo on vercel.com
2. **Root Directory:** `frontend`
3. **Framework:** Next.js (auto-detected)
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

---

## 📡 API Reference

### Auth
| Method | Endpoint           | Access  | Description       |
|--------|--------------------|---------|-------------------|
| POST   | /api/auth/register | Public  | Borrower signup   |
| POST   | /api/auth/login    | Public  | Login all roles   |
| GET    | /api/auth/me       | Any     | Get current user  |

### Loans
| Method | Endpoint                    | Access              | Description              |
|--------|-----------------------------|---------------------|--------------------------|
| POST   | /api/loans/check-eligibility| borrower            | Run BRE check            |
| POST   | /api/loans/apply            | borrower            | Submit loan application  |
| GET    | /api/loans/my-loans         | borrower            | Get own loans            |
| GET    | /api/loans                  | ops roles + admin   | Get all loans (filterable)|
| GET    | /api/loans/:id              | auth                | Get single loan          |
| PATCH  | /api/loans/:id/sanction     | sanction + admin    | Approve or reject        |
| PATCH  | /api/loans/:id/disburse     | disbursement + admin| Disburse loan            |

### Payments
| Method | Endpoint                    | Access              | Description          |
|--------|-----------------------------|---------------------|----------------------|
| POST   | /api/payments               | collection + admin  | Record a payment     |
| GET    | /api/payments/loan/:loanId  | collection + admin + borrower | Get payments |

### Upload
| Method | Endpoint                 | Access  | Description          |
|--------|--------------------------|---------|----------------------|
| POST   | /api/upload/salary-slip  | borrower| Upload salary slip   |

### Users & Dashboard
| Method | Endpoint              | Access        | Description             |
|--------|-----------------------|---------------|-------------------------|
| GET    | /api/users/borrowers  | sales + admin | Borrowers with status   |
| GET    | /api/dashboard/stats  | admin         | System-wide stats       |
