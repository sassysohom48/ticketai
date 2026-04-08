# AI Ticket Router — BERT-Powered Customer Support

A full-stack web app that routes customer support tickets to the right department using NLP/BERT classification.

## Tech Stack

| Layer    | Tech |
|----------|------|
| Backend  | Python · Flask · Flask-CORS · NumPy |
| ML Model | HuggingFace Transformers (BERT) + keyword-BERT fallback |
| Frontend | React 18 · Vite · Tailwind CSS · Axios · Lucide Icons |

## Features

- **POST /predict** — classifies ticket text into one of 7 departments
- **GET /tickets** — paginated ticket list with department filter
- **POST /feedback** — human override for label correction
- **GET /stats** — department distribution + confidence metrics
- Animated confidence bar, dark/light mode, responsive layout

---

## Local Development

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r ../requirements.txt
python app.py
```

Flask starts at **http://localhost:5000**

To enable real BERT (optional, needs GPU/CPU RAM):

```bash
pip install transformers torch sentencepiece
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

React starts at **http://localhost:3000**  
(Vite proxies all `/predict`, `/tickets` etc. calls to Flask.)

---

## Project Structure

```
project/
├── backend/
│   ├── app.py            ← Flask API (all endpoints)
│   └── model_loader.py   ← BERT / keyword-BERT classifier
│
├── model/
│   └── saved_model/      ← Drop your fine-tuned BERT files here
│       └── .gitkeep
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js    ← Dev proxy config
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js              ← Centralised API calls
│       ├── constants/
│       │   └── departments.js  ← Department colours + icons
│       ├── pages/
│       │   ├── CustomerPage.jsx
│       │   └── AdminDashboard.jsx
│       └── components/
│           ├── Navbar.jsx
│           ├── PredictionResult.jsx
│           ├── TicketCard.jsx
│           ├── OverrideModal.jsx
│           └── Toast.jsx
│
├── requirements.txt
└── README.md
```

---

## API Reference

### POST /predict
```json
// Request
{ "subject": "App crashes", "message": "It crashes on launch..." }

// Response
{
  "department": "Technical Support",
  "confidence": 0.89,
  "ticket_id": "A1B2C3D4",
  "status": "Ticket routed successfully",
  "timestamp": "2024-01-15T14:30:00"
}
```

### GET /health
```json
{ "status": "running", "model": "keyword-bert", "tickets_processed": 42 }
```

### GET /tickets?department=All
```json
{ "tickets": [...], "total": 10, "all_count": 10 }
```

### POST /feedback
```json
// Request
{ "ticket_id": "A1B2C3D4", "correct_department": "Billing & Payments" }

// Response
{ "status": "success", "message": "Ticket A1B2C3D4 reassigned to 'Billing & Payments'" }
```

### GET /stats
```json
{
  "total_tickets": 42,
  "department_distribution": { "Technical Support": 15, ... },
  "average_confidence": 0.84,
  "overridden_count": 3
}
```

---

## Deployment

### Backend — Railway / Render

1. Create a new web service pointing to the `backend/` folder
2. Set start command: `python app.py`
3. Add env var: `PORT=5000`

### Frontend — Vercel

1. Set root directory to `frontend/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add env variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

---

## Departments

| Department          | Triggered by |
|---------------------|--------------|
| Technical Support   | bugs, crashes, errors, network issues |
| Billing & Payments  | invoices, charges, refunds, subscriptions |
| Account Management  | login, 2FA, profile, account deletion |
| Returns & Refunds   | returns, damaged goods, exchanges |
| Shipping & Delivery | tracking, delayed packages, lost orders |
| Product Information | specs, compatibility, manuals |
| General Inquiry     | everything else |
