# JOVE — Journey of Visionation & Excellence

> Precision · Learning · Innovation · Automation

One codebase, **two websites**, one deployment:

| | What | Where |
|---|---|---|
| 🌐 **Public website** | Brand site with a 3D hero, programs & packages, quote estimator, FrameMind media studio, six free Virtual Labs, kit store with checkout, certificate verification | `/` |
| 🛠 **JOVE HQ** | The company portal — CRM, workshops, run sheets, finance & GST invoices, payroll, kits & inventory, shop orders, curriculum, SOP library with version history, printables, certificates, media pipeline, business planner | `/hq` (optional `hq.your-domain.com`) |

## Two repositories — code is public, company data is private

| Repository | Visibility | Holds |
|---|---|---|
| **`jove-platform`** (this one) | **Public** | Only the website and HQ **code**. Vercel deploys from it. No passwords, no company data. |
| **`jove-hq-data`** | **Private** | HQ's database: `data/*.json` (schools, workshops, invoices, payroll…), `OPERATIONS/` (SOPs, curriculum, finance, legal, business plan) and `vault/` (receipts, signed forms). |

There is no database server and no storage service. HQ reads and writes the **private data repo** through the GitHub API, so every save is a commit: full history, who changed what, one-click restore. Vercel never needs access to the data repo.

**Safety lock:** HQ checks that `GITHUB_REPO` is private and **refuses to save** if it is public. Never point `GITHUB_REPO` at this code repo.

**Passwords are never in GitHub.** Team logins live only in Vercel's environment variables (as hashes).

---

## 1 · Deploy on Vercel (≈ 10 minutes)

1. **Import** this repository in Vercel → *Add New → Project* → framework **Next.js** (defaults are fine).
2. **Create a GitHub token** for the data repo: GitHub → Settings → Developer settings → *Fine-grained personal access tokens* → **Repository access: only `jove-hq-data`** → Permissions → **Contents: Read and write** → Generate.
3. **Generate your environment block** on your own computer (passwords are hidden while you type; only their hashes are printed):

   ```bash
   node scripts/make-hq-env.mjs
   ```

4. **Paste** the printed lines into Vercel → Project → Settings → **Environment Variables** (Production + Preview), and add the token from step 2:

   | Variable | Value |
   |---|---|
   | `HQ_SESSION_SECRET` | printed by the script (64 random hex characters) |
   | `HQ_USERS` | printed by the script (JSON list of logins with hashed passwords) |
   | `GITHUB_REPO` | `your-account/jove-hq-data` — the **private** data repo |
   | `GITHUB_BRANCH` | `main` |
   | `GITHUB_TOKEN` | the fine-grained token from step 2 |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (used in QR codes, links, metadata) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_PHONE` / `NEXT_PUBLIC_WHATSAPP` | optional — shown on the site when set (WhatsApp: digits with country code, e.g. `919876543210`) |
   | `NEXT_PUBLIC_LOCATION` / `NEXT_PUBLIC_INSTAGRAM` / `NEXT_PUBLIC_YOUTUBE` / `NEXT_PUBLIC_LINKEDIN` | optional |

5. **Deploy** (or redeploy after adding variables). Open `/hq`, sign in, and fill **HQ → Settings** (legal name, address, GSTIN, bank/UPI for invoices, numbering).
6. *(Optional)* add `hq.your-domain.com` as a second domain in Vercel — it opens the portal directly.

Roles: **founder / admin** (everything) · **ops** (everything except payroll & settings) · **trainer** (workshops, curriculum, printables, kits) · **media** (media studio, content, testimonials, docs).

To add or change a login later, run the script again (or `node scripts/hash-password.mjs "new-password"`), update `HQ_USERS` in Vercel and redeploy.

---

## 2 · Run locally

```bash
npm install
cp .env.example .env.local   # then fill HQ_USERS + HQ_SESSION_SECRET
npm run dev                  # http://localhost:3000  ·  HQ at /hq
```

Without `GITHUB_TOKEN`, HQ reads and writes local `data/`, `OPERATIONS/` and `vault/` folders. Those folders are **gitignored** here, so nothing you create locally can be committed to this public repo. To work against the real data, put `GITHUB_TOKEN` and `GITHUB_REPO` in `.env.local` (use `GITHUB_BRANCH` for a test branch).

> **Windows note:** npm scripts break when the folder path contains `&` (e.g. "Journey of Visionation & Excellence"). Clone into a path without `&`, or run `node node_modules/next/dist/bin/next dev`.

---

## 3 · What is inside

**Public site** — home (3D sketch-arm hero, loading screen), about, programs, packages with a live quote estimator, studio, six Virtual Labs (theory → demo → hands-on → challenge → certificate), kit store with cart and checkout, contact, careers, testimonials, certificate verification, legal pages.

**JOVE HQ** (`/hq`) — Command Center · Tasks · Activity Log · Website Leads · Schools CRM · Proposals · Workshops (calendar, run sheet, checklists, kits planner) · Travel · Media Studio · Certificates · Feedback & Testimonials · Finance (P&L, GST invoices, expenses, reports) · Team & Payroll · Business Planner · Kits & BOM · Inventory, Vendors & Purchase Orders · Online Shop · Curriculum · Operations Library · Printables · File Vault · Settings.

**Printable documents** (browser → *Save as PDF*) — proposal, tax invoice, receipt, payslip, purchase order, packing slip, kit labels, run sheet, attendance sheets, certificates with QR, consent and feedback forms, name tags, ID cards, visiting cards, letterhead, workshop poster, table tents, safety poster, any Operations document.

---

## 4 · Where things live

```
src/app/(site)/        public website pages
src/app/hq/            JOVE HQ — login, (portal)/ modules, print/ documents
src/app/api/           hq/* (authenticated) · public/submit (website forms → HQ leads) · public/order (shop → HQ orders)
src/lib/content/       business.ts  ← prices, kits/BOMs, packages, costs, targets
                       labs.ts      ← Virtual Labs catalogue
src/lib/hq/            collections (schema), auth, records engine, settings, roles, nav
src/lib/store/         the GitHub-as-database layer (with the private-repo safety lock)
src/components/        brand/ ui/ site/ hq/ labs/ three/ print/
public/brand/          logo system  ·  public/models/  the hero's 3D sketch arm
scripts/               make-hq-env.mjs, hash-password.mjs, process-assets.py, typecheck-paths.mjs, check-routes.mjs
```

Change a price, kit component or cost in **`src/lib/content/business.ts`** and the website, quote estimator, proposals, invoice prefill and the business planner all update together.

---

## 5 · Brand

Blueprint / engineering-sketch identity on warm paper — Graphite `#2B2B2B`, Charcoal `#4A4A4A`, Blueprint Gray `#7A7A7A`, Warm Paper `#F5F1E8`, Accent Gray `#C9C9C9`, Montserrat. Tokens live in `src/app/globals.css`.

Imagery and films in `public/images` and `public/videos` were generated for launch and are illustrative — replace them with real JOVE Day footage as it is shot. Drop founder photos at `public/team/shivaprasad.jpg` and `public/team/chinmay.jpg`.

---

© JOVE — Journey of Visionation & Excellence · Media partner: [FrameMind AI Studio](https://framemind-ai-studio.figma.site/)
