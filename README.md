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
3. **Generate your environment file** on your own computer. It writes `.env.vercel` (gitignored); only password hashes go into it:

   ```bash
   node scripts/make-hq-env.mjs
   ```

   You choose each password (hidden while you type in PowerShell or Windows Terminal; Git Bash cannot hide input and says so). Or let it create strong ones for both founders, saved to `.env.hq-logins`:

   ```bash
   node scripts/make-hq-env.mjs --generate
   ```

4. **Import** it: Vercel → Project → Settings → **Environment Variables** → *Import .env* → choose `.env.vercel` (Production + Preview). Paste the token from step 2 after `GITHUB_TOKEN=` first.

   | Variable | Value |
   |---|---|
   | `HQ_SESSION_SECRET` | written by the script (64 random hex characters) |
   | `HQ_USERS` | written by the script (JSON list of logins with hashed passwords) |
   | `GITHUB_REPO` | `your-account/jove-hq-data` — the **private** data repo |
   | `GITHUB_BRANCH` | `main` |
   | `GITHUB_TOKEN` | the fine-grained token from step 2 |
   | `NEXT_PUBLIC_SITE_URL` | optional — defaults to `https://www.jove.website` (used in QR codes, links, share previews) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_PHONE` / `NEXT_PUBLIC_WHATSAPP` | optional — shown on the site when set (WhatsApp: digits with country code, e.g. `919876543210`) |
   | `NEXT_PUBLIC_LOCATION` / `NEXT_PUBLIC_INSTAGRAM` / `NEXT_PUBLIC_YOUTUBE` / `NEXT_PUBLIC_LINKEDIN` | optional |
   | `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_ANALYTICS_CONSENT` | optional — see *Analytics* below |
   | `VERCEL_DEPLOY_HOOK_URL` | optional — the address of a Vercel Deploy Hook, so saving a price in HQ rebuilds the site by itself (see *Prices and costs* below) |

5. **Deploy** (or redeploy after adding variables). Delete `.env.vercel` and `.env.hq-logins` once the variables are saved. Open `/hq`, sign in, and fill **HQ → Settings** (legal name, address, GSTIN, bank/UPI for invoices, numbering).
6. *(Optional)* add `hq.your-domain.com` as a second domain in Vercel — it opens the portal directly.

**Roles.** Only **founder / admin** accounts can add, change or delete anything. Every other role can open, read and print, and nothing more — the server refuses every save from them (`EDITORS` in `src/lib/hq/roles.ts`). **viewer** is the shared interns login: workshops without amounts, media, certificates, feedback, curriculum, printables, the teaching and delivery folders of the library, and only the tasks a founder ticks "Show this task to interns" — no finance, proposals, CRM or leads, school contact numbers, pay, kits and inventory, shop, file vault, activity log or settings (`src/lib/hq/access.ts`). **ops** sees everything except payroll, the activity log and settings; **trainer** and **media** see the modules for their work, without amounts. A session is checked against today's `HQ_USERS` on every request, including a stamp of the password it signed in with, so removing a login or changing its password signs those users out as soon as the redeploy finishes.

**Add, re-key or remove one person** without touching anyone else's password:

```bash
node scripts/hq-user.mjs password intern                        # new shared password for the interns login
node scripts/hq-user.mjs add ravi "Ravi Kumar" --role trainer   # a personal login; no --role = viewer, --role founder = full access
node scripts/hq-user.mjs remove ravi
node scripts/hq-user.mjs list
```

It writes the new `HQ_USERS` value to `.env.hq-users` (paste it over `HQ_USERS` in Vercel → Environment Variables, then redeploy) and the new password to `.env.hq-logins`; both are gitignored. Running `make-hq-env.mjs` again builds the whole list afresh, so every login gets a new password.

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
src/lib/content/       business.ts  ← the public catalogue: programmes, packages, kits and their public prices
                       labs.ts      ← Virtual Labs catalogue
src/lib/pricebook/     the price book: types and arithmetic (cost, margin, price that follows cost)
src/lib/hq/            collections (schema), auth, records engine, settings, roles, nav
src/lib/store/         the GitHub-as-database layer (with the private-repo safety lock)
src/components/        brand/ ui/ site/ hq/ labs/ three/ print/
public/brand/          logo system  ·  public/models/  the hero's 3D sketch arm
scripts/               make-hq-env.mjs (first set-up: Vercel env + logins), hq-user.mjs (add / remove one login), hash-password.mjs, process-assets.py, typecheck-paths.mjs, check-routes.mjs
```

### Prices and costs

Prices and costs are changed in **HQ → Money → Prices & Costs**, not in the code. That screen edits one document in the private data repo, `data/pricebook.json`:

- **Private numbers** — what every kit part costs, margins, the cost lines of a JOVE Day, monthly costs, launch budget, targets. HQ reads them at run time, for founder / admin / ops only. They are never in this repository or in the site's JavaScript.
- **Public prices** — kit MRPs (typed, or following the cost at a chosen margin), per-student workshop prices, minimums, payment terms, add-on prices. On each save HQ stores them under `published`.

The site does not look prices up while it runs. `next.config.ts` reads the `published` part at **build** time and bakes it in (`JOVE_PRICEBOOK` → `src/lib/content/business.ts`), so the website, shop, brochures, proposals, invoice prefill and quote estimator always agree. Saving a price therefore needs a rebuild: with `VERCEL_DEPLOY_HOOK_URL` set (Vercel → Settings → Git → Deploy Hooks, branch `main`) HQ starts it and the new price is live in about a minute; without it, redeploy by hand. The numbers typed in `business.ts` are only the starting values used until a price book has been saved. A build stops, leaving the previous deployment live, if the data repo is configured but the price book cannot be read.

### Analytics

Google Analytics 4 runs on the public site only (`src/lib/analytics.ts`, `src/components/site/Analytics.tsx`).

- **Asked first.** Nothing is sent to Google Analytics until a visitor chooses *Allow*; they can change it any time on `/privacy`. Set `NEXT_PUBLIC_ANALYTICS_CONSENT=always` to measure without asking (visitors can still opt out).
- **Never measured:** `/hq`, the Virtual Lab journeys (`/labs/<lab>` — the pages built for children) and certificate pages (`/verify/<id>`). Once the tag is running, opening one of these is a full page load into a document without it, because the tag reports the previous address with every in-site page view.
- **No advertising features**, and only the site's own address (`NEXT_PUBLIC_SITE_URL`, by default `www.jove.website`) sends data — local builds, tunnels and `*.vercel.app` previews never do.
- **Events:** page views, `generate_lead` (enquiry, quote estimator, labs waitlist) and `purchase` (a kit order placed — kits and value only, never the order number). Mark `generate_lead` as a key event in GA → Admin → Events.
- Another property: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`. No analytics: `NEXT_PUBLIC_GA_ID=off`.

---

## 5 · Brand

Blueprint / engineering-sketch identity on warm paper — Graphite `#2B2B2B`, Charcoal `#4A4A4A`, Blueprint Gray `#7A7A7A`, Warm Paper `#F5F1E8`, Accent Gray `#C9C9C9`, Montserrat. Tokens live in `src/app/globals.css`.

Imagery and films in `public/images` and `public/videos` were generated for launch and are illustrative — replace them with real JOVE Day footage as it is shot. Drop founder photos at `public/team/shivaprasad.jpg` and `public/team/chinmay.jpg`.

---

© JOVE — Journey of Visionation & Excellence · Media partner: [FrameMind AI Studio](https://framemind-ai-studio.figma.site/)
