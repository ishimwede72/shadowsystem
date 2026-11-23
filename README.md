# SHADOW SYSTEMS

> **BEYOND THE VISIBLE.**
> A fictional, fully local operations console — 97 routes across 17 modules, built with React 19, TypeScript and Tailwind v4.

<span></span>

## What this is

SHADOW SYSTEMS is an interactive fiction: a cinematic "intelligence operations platform" that looks and feels like a
command centre, but is **entirely simulated**. Every account, transaction, target, camera feed, case file, mission,
operator and message is generated in the browser from a fixed seed. There is no backend, no API key, no account and no
network traffic after the page loads.

Every module carries an explicit fictional/simulated notice, and every export repeats it.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run preview
```

The landing page (`/`) is public. **`/access` is the operator authorisation terminal** — granting access stores a flag
locally and unlocks the console shell.

## Modules

| Module | Route | Highlights |
| --- | --- | --- |
| Command Center | `/command-center` | Global overview, system health, activity history, cinematic view, terminal |
| Financial Systems | `/finance` | Accounts, transactions, transfers, cards, banks, wallets, crypto, analytics |
| Cyber Operations | `/cyber` | Vulnerabilities, firewall simulator, activity stream, terminal, access sim, password lab, server lab |
| Global Intelligence | `/geoint` | World map (d3-geo + topojson), moving targets, geofencing, routes, history |
| Surveillance | `/surveillance` | Camera wall with synthetic feeds, playback, floor plan, incidents |
| Intelligence DB | `/intelligence` | Cases, people, organisations, link graph, records, reports |
| Network Ops | `/network` | Topology, servers, devices, traffic, monitoring |
| Forensics | `/forensics` | Evidence, files, timeline, hash lab, metadata |
| Underground Market | `/underground` | Market, vendors, messages, orders |
| **Cryptography** | `/cryptography` | **Real** Web Crypto: AES-256-GCM, ECDSA P-256, SHA-1/256/384/512, CRC32, FNV-1a, plus classical ciphers |
| **SHADOW AI** | `/ai` | Rule-based analyst: chat, report compiler, cross-module analysis sweeps, configuration |
| **Crisis Management** | `/crisis` | Incident board, alert centre, infrastructure monitor, crisis timeline, emergency HUD |
| **Communications** | `/communications` | Operator chat, roster, voice console, dispatch broadcast |
| **Missions** | `/missions` | Mission control, builder, live console, archive, six scenario templates |
| **Reports** | `/reports` | Local report library, six department generators, full report view |
| **Settings** | `/settings` | General, profile, appearance, sound, shortcuts, simulation engine, data & storage |

Plus `/cinematic`, `/system` (404) and a command palette (`Ctrl/⌘ + K`).

## Simulation engine

`src/services/engine.ts` is the single source of truth: a zustand store plus an event bus that ticks on an interval and
drives live telemetry — node load, market prices, target movement, camera signal, mission progress — across every module.

```ts
import { useEngine } from '@/services/engine'
const s = useEngine()
s.addTransaction({...})        // finance
s.enterEmergency('CRI-101')    // crisis
s.runMissionEvent(id, event)   // missions
```

Mission events cross module boundaries: an `escalate` step raises the crisis HUD, an `outage` step knocks a node
offline, a `txn` step writes a real transaction into the ledger.

Determinism: the world is generated from `makeRng(seed)` with a default seed of `20261123`. Resetting with a new seed
regenerates every collection; preferences, reports and the AI transcript are preserved.

## Local persistence

Everything is stored in the browser, and nothing is uploaded.

| Key | Contents |
| --- | --- |
| `shadow-systems-prefs` | Accent, density, sound, profile, favourites |
| `shadow-systems-engine` | Boot flag, speed, seed, active operator |
| `shadow-systems-reports` | Compiled report library + number counter |
| `shadow-ai-history` | Last 40 SHADOW AI messages |

Inspect and clear all of them from **Settings → Data & Storage**.

## Design system

Tailwind v4 CSS-first tokens in `src/index.css`:

- **Surface** `#070B11` · **Panel** `#101923` · **Elevated** `#16212B` · **Line** `#233241`
- **Accent** `#28D8EA` (switchable) · **Ink** `#E9F0F6` / `#93A3B4` / `#65788B`
- Semantic: green `#38DB91`, blue `#377EFF`, amber `#F5B942`, red `#F14E61`

Components live in `src/components/ui` (`Panel`, `PageHeader`, `StatCard`, `Tabs`, `Modal`, `KeyValue`, `StatusPill`,
`InlineAlert`, …) and `src/components/charts` (Area, Line, Bar, Donut, Radial, Radar, Sparkline, HeatStrip — all Recharts).

## Verification

`jsdom` is a dev dependency, so the harnesses run straight from a fresh clone. Everything is wired to one command:

```bash
npm run verify     # type check + lint + structural review + render + audit + interactions
```

Or run the pieces individually:

```bash
npx tsc -b --noEmit            # strict type check
npx vite build                 # production bundle
npm run lint                   # oxlint (0 errors)
node scripts/review.mjs        # structural/visual review of all 98 pages
node scripts/smoke.mjs         # server-renders all 98 pages
node scripts/mount.mjs         # client-mounts pages in jsdom (effects + timers)
node scripts/app-check.mjs /finance /missions/active   # full router + shell per route
node scripts/audit.mjs         # content + accessibility audit
node scripts/interact.mjs      # 51 click-through behaviour assertions
```

| Harness | What it protects |
| --- | --- |
| `review.mjs` | Layout regressions: tables that overflow, skipped heading levels, missing `h1`, absurd numbers, cloned rows |
| `smoke.mjs` | Every page renders server-side without crashing (catches bad hooks/props) |
| `mount.mjs` | Every page mounts in a real DOM, effects and timers included (catches runtime errors SSR hides) |
| `app-check.mjs` | Each route resolves through the real `App` router and renders the shell with a sensible title |
| `audit.mjs` | No `NaN`/`undefined`/`TODO` leakage into the UI; every button, input and image has an accessible name |
| `interact.mjs` | The flows actually do something: crisis escalation, dispatch, report compile, mission launch, settings, … |

`scripts/page-list.mjs` is the single inventory of pages that all harnesses read from — add a page there once and every
check covers it.

Current status: **type check clean · lint 0 errors · production build clean · 98/98 pages render · 98/98 mount with zero
warnings · 101/101 routes render the shell · 0 placeholder leaks · 0 accessibility findings · 51/51 interactions pass.**

## Accessibility & ergonomics

- Full keyboard model: command palette, `G`-prefixed navigation, `Ctrl/⌘ + B/N/M`, `Esc` to dismiss.
- Semantics audited by `scripts/audit.mjs`: one `h1` per page with no skipped heading levels, accessible names on every
  icon-only control, labelled filter selects, alt text on images, and visible focus rings throughout.
- `prefers`-style switches for reduced motion and texture; density and font scale are independent.
- Audio cues are synthesised with the Web Audio API on demand — no autoplay, no asset files, off by default.

## Legal / intent

This project is a **fiction**. It does not access, scan, monitor, contact or model any real system, network, account,
organisation or person. Names, coordinates, balances, vulnerabilities and "intelligence" are invented by a seeded
generator and are presented as such throughout the interface.
