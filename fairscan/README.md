# ⚖️ FairScan — AI Bias Detection Tool

> Detect and fix hidden bias in AI systems — built for Google Solution Challenge 2025

**Live Demo:** _[Add your Vercel URL here]_  
**API:** _[Add your Render URL here]_

---

## The Problem

AI systems making life-changing decisions (hiring, loans, healthcare) silently learn from historically biased data and discriminate at scale. Most organizations have no way to check — existing bias tools require a data science PhD to operate.

## Our Solution

FairScan gives **any organization** a simple tool: upload your decision data, get instant bias detection with plain-English explanations powered by Gemini, and download a professional PDF audit report — no data science team required.

## SDG Alignment
- 🌍 **SDG 10** — Reduced Inequalities  
- ⚖️ **SDG 16** — Peace, Justice and Strong Institutions

## Impact
- 67% of hiring algorithms show measurable gender bias
- 2.3× higher loan denial rates for minority applicants  
- FairScan makes bias auditing accessible to organizations without ML teams

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS → **Vercel** |
| Backend | FastAPI + Python → **Render** |
| ML | scikit-learn + SciPy + SHAP |
| AI Explanations | Google **Gemini API** |

## Fairness Metrics
1. **Disparate Impact Ratio** — 80% legal rule threshold  
2. **Demographic Parity Difference** — group outcome rate gap  
3. **Chi-Square Statistical Test** — is bias statistically significant?

---

## Run Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Add your Gemini API key
uvicorn main:app --reload
```
API available at `http://localhost:8000`  
Docs at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App at `http://localhost:5173`

---

## Deploy

**Backend → Render.com**
1. Connect GitHub repo to Render
2. Set Root Directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env var: `GEMINI_API_KEY`

**Frontend → Vercel.com**
1. Connect GitHub repo to Vercel
2. Set Root Directory: `frontend`
3. Add env var: `VITE_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

Built in 15 days · Team of 4 · Google Solution Challenge 2025
