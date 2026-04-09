# ReelFruit — Deployment Guide
## Neon Database → GitHub → Vercel

---

## Overview
- **Database**: Neon (free PostgreSQL in the cloud)
- **Backend**: Node.js serverless functions (run on Vercel, zero servers to manage)
- **Hosting**: Vercel (free tier, auto-deploys from GitHub)
- **Total cost**: $0 on free tiers

---

## STEP 1 — Create Neon Database

1. Go to **https://neon.tech** and sign up (free)
2. Click **"New Project"**
3. Name it `reelfruit` → choose region closest to Nigeria (e.g. `AWS eu-west-1`)
4. Click **Create Project**
5. You'll land on the dashboard. Find **"Connection string"** — it looks like:
   ```
   postgresql://alex:password@ep-cool-name-123.eu-west-1.aws.neon.tech/neondb?sslmode=require
   ```
6. **Copy this string** — you'll need it in Steps 4 and 5

> **Note**: Neon auto-creates the database tables on first API call — no manual SQL needed.

---

## STEP 2 — Prepare the Files

You should have this folder structure:
```
reelfruit-app/
├── public/
│   └── index.html          ← the quiz app
├── api/
│   ├── submit.js           ← saves participants
│   ├── participants.js     ← fetches records
│   ├── stats.js            ← summary stats
│   ├── export.js           ← CSV download
│   ├── stores.js           ← store codes
│   └── admin.js            ← clear data, ping
├── lib/
│   └── db.js               ← Neon connection
├── package.json
├── vercel.json
├── .env.local              ← local secrets (NOT committed)
└── .gitignore
```

**Edit `public/index.html`** — find this line near the top of the script:
```javascript
const API_KEY = 'REPLACE_WITH_YOUR_ADMIN_SECRET';
```
Change it to your chosen secret, e.g.:
```javascript
const API_KEY = 'rf_super_secret_2024';
```

**Edit `.env.local`** — set your values:
```
DATABASE_URL=postgresql://your-neon-connection-string
ADMIN_SECRET=rf_super_secret_2024
```
The `ADMIN_SECRET` must exactly match `API_KEY` in `index.html`.

---

## STEP 3 — Push to GitHub

Open Terminal (Mac/Linux) or Command Prompt (Windows) in your project folder:

```bash
# Initialize git repository
cd reelfruit-app
git init

# Stage all files
git add .

# First commit
git commit -m "Initial commit — ReelFruit Answer & Win"
```

Now create a GitHub repository:
1. Go to **https://github.com** → click **"New repository"**
2. Name it `reelfruit-app`
3. Leave it **Public** or **Private** — both work
4. **Don't** check "Initialize with README" (you already have files)
5. Click **Create repository**
6. GitHub shows you commands — run the ones under **"…or push an existing repository"**:

```bash
git remote add origin https://github.com/YOUR_USERNAME/reelfruit-app.git
git branch -M main
git push -u origin main
```

Your code is now on GitHub. ✅

---

## STEP 4 — Deploy to Vercel

1. Go to **https://vercel.com** and sign up with your GitHub account
2. Click **"Add New Project"**
3. Find `reelfruit-app` in the list → click **"Import"**
4. Vercel auto-detects the settings — **don't change anything yet**
5. **BEFORE clicking Deploy** → click **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `ADMIN_SECRET` | your chosen secret (e.g. `rf_super_secret_2024`) |

6. Now click **"Deploy"**
7. Wait ~1 minute — Vercel builds and deploys

You'll get a URL like `https://reelfruit-app.vercel.app` 🎉

---

## STEP 5 — Initialize the Database

Visit this URL in your browser (replace with your Vercel URL):
```
https://reelfruit-app.vercel.app/api/admin?op=ping&key=rf_super_secret_2024
```

You should see:
```json
{"status":"ok","time":"2025-...","db":"connected"}
```

If you see this, the database is connected and tables were created automatically. ✅

---

## STEP 6 — Test the Full Flow

1. Open your Vercel URL: `https://reelfruit-app.vercel.app`
2. Play through the quiz with test data
3. Triple-tap the logo → login (password: `reelfruit2024`)
4. Go to **Data tab** — your test entry should appear
5. Click **Export Excel** — downloads from the real database

---

## STEP 7 — Connect Custom Domain (GoDaddy → Vercel)

1. In Vercel → your project → **Settings → Domains**
2. Type your GoDaddy domain (e.g. `quiz.reelfruit.com`) → click **Add**
3. Vercel shows you DNS records to add
4. Log in to **GoDaddy → DNS Management** for your domain
5. Add the records Vercel shows (usually a CNAME or A record)
6. Wait 5-30 minutes for DNS to propagate

> Use a subdomain like `quiz.reelfruit.com` or `win.reelfruit.com` so it doesn't clash with your main site.

---

## STEP 8 — Future Updates

Whenever you update the app, just push to GitHub:

```bash
git add .
git commit -m "Updated questions / prize settings"
git push
```

Vercel automatically redeploys in ~30 seconds. No manual uploads needed.

---

## Fixing Common Errors

### "Function returned empty response"
→ Check Vercel → your project → **Functions** tab → click the function → view logs

### "Database connection failed"
→ Go to Vercel → Settings → Environment Variables
→ Make sure `DATABASE_URL` is set and matches your Neon connection string exactly

### "Unauthorized" in Data tab
→ `API_KEY` in `index.html` doesn't match `ADMIN_SECRET` in Vercel env vars
→ Update Vercel env var → Redeploy (Deployments → three dots → Redeploy)

### "Cannot find module '../lib/db.js'"
→ Make sure you pushed all files including the `lib/` folder
→ Run: `git status` to check, `git add lib/ && git push`

### Data tab shows "local session data only"
→ API is not reachable — usually means env vars aren't set
→ Test the ping URL to confirm API is working

---

## Security Before Going Live

- [ ] Change `API_KEY` in `index.html` from `reelfruit_api_2024` to something strong
- [ ] Set matching `ADMIN_SECRET` in Vercel env vars
- [ ] Change admin dashboard password (Settings tab inside the app)
- [ ] Never commit `.env.local` to GitHub (it's in `.gitignore`)

---

## Neon Free Tier Limits

| Resource | Free Limit |
|---|---|
| Storage | 0.5 GB |
| Compute hours | 191 hrs/month |
| Databases | 1 project |
| Branches | 10 |

For an in-store activation with a few hundred participants this is more than enough. At ~100 bytes per record you can store millions of participants in 0.5 GB.

---

*ReelFruit Answer & Win — Neon + Vercel deployment*
