# Cavs Academy — Command Center

Frontend prototype for the Cavs Youth Basketball administrator and coach platform.
Everything runs on realistic in-browser demo data; there is no backend, payment
processor or messaging service connected yet.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run typecheck  # tsc, no emit
npm run smoke      # renders every route for every role + asserts the role model
```

Entry screen: `/signin` (any credentials continue). The app itself opens at `/`.

---

## What is built

**Administrator** — Dashboard, Schedule, Live Games, Teams, Players, Registrations,
Payments, Communications, Reports, Staff & Roles, Locations, Settings.

**Payments** is the deepest module: invoices, payment plans, installment schedules,
AutoPay and stored-method state, partial payments, failed payments, credits,
discounts, refunds, voids, reminders, and a dedicated collection centre. See below.

**Coach** — the same product, scoped: Dashboard, My Teams, Players, Schedule,
Live Games, Communications, plus the team tools (attendance, development,
volunteers, channels).

Switch between them with the **Viewing as** control in the header. Navigation,
widgets and available actions visibly simplify, and admin-only routes are guarded
at the router — a coach who types `/payments` gets an explanation, not the screen.

Parent and Player experiences are **not** built. They appear only as clearly marked
future scope in the role switcher and in Settings → Roles & Access.

## Architecture

```
src/
  data/          types, mock academy (deterministic — same demo data every load),
                 billing ledger (invoices, plans, installments), derived analytics
  store/         AppStore — role, all mutable state, permissions, toasts, overlays
  lib/           utils, chart palette
  components/
    layout/      AppShell, Sidebar, Topbar, PageHeader, RequirePermission, nav config
    ui/          Button, Card, Badge, Field, Tabs, Modal, SideDrawer, Toast,
                 DataTable, FilterBar, Avatar, EmptyState, Skeleton
    charts/      TrendChart, AttendanceOrbit, ActivityOrbit, PaymentArc, FunnelFlow,
                 Heatmap, BarCompare, Sparkline, ChartCard, chart-kit
    domain/      MetricCard, LiveGameHero, TodayTimeline, TeamCard, EventDrawer,
                 CalendarGrid, ActivityFeed
    billing/     PaymentHealth arc, InstallmentTimeline, InvoiceStatusBadge,
                 BillingModals (record payment, pay now, create invoice, reminders,
                 refund, convert-to-plan, apply credit, create plan)
    overlays/    CommandPalette (⌘K), QuickCreate, RoleSwitcher, NotificationPanel,
                 CreateModals
  pages/         one file per module
```

**Connecting a backend later.** Every mutation goes through `AppStore` — `adjustScore`,
`createGame`, `moveRegistration`, `assignPlayerTeam`, `sendAnnouncement` and the rest.
Swapping local state for API calls is confined to that file; no page or component
reaches for data directly except through `useApp()` and the read-only lookups in
`data/mock.ts`.

## Payments

The invoice ledger in `data/billing.ts` is the **single source of truth for money**.
Player payment badges, the dashboard widget, registration detail, player profiles and
the payment report all resolve to it — there is no second, contradictory payment model.

Headline figures are balanced to exact targets at generation time and asserted in the
smoke suite:

| Figure | Value |
|---|---|
| Collected | $42,860 |
| Outstanding (billed, unpaid) | $6,240 |
| — overdue | $2,180 |
| — failed | $1,860 |
| — due soon | $2,200 |
| Upcoming (future installments) | $8,450 |
| Collection rate | 91.4% |
| Families needing attention | 12 |

**Collection rate** is `collected / (collected + overdue + failed)` — the share of
everything *already due* that has been collected. Installments not yet due are not
counted against it.

**Families needing attention** counts distinct households, not invoices: two invoices
for one family is one phone call.

The demo invoice is **INV-1048** — Jordan Miles, 14U Elite, $1,200 total on a
3-installment plan, $800 paid, $400 due. Those numbers are identical on the player
profile, the registration, the dashboard and the report.

Every mutation (`recordPayment`, `refundPayment`, `convertToPlan`, `applyCredit`,
`retryPayment`, `sendReminder`, …) lives in `AppStore` and updates the ledger through
one `reconcile()` function that recomputes totals, balance, next due date and status.
Swapping local state for API calls stays confined to that file.

No payment provider is connected. Card details are masked display strings only — no
real or realistic card numbers are stored or generated.

## Design system

Midnight + ivory + Cavs royal blue + Cavs orange. Blue carries navigation and
interaction. **Orange is reserved** for live games, urgent broadcasts, primary CTAs
and roster-full states — which is why it reads as significant wherever it appears.

Inter for UI, Barlow Condensed for scores, large figures and game headings only.

Live Game Control deliberately switches into a dark **Arena Mode**, so normal
operations (clean, light) and game day (cinematic, dark) feel like different rooms.

### Charts

Custom SVG throughout — no charting library, so nothing looks like a default.
The categorical palettes for both light and Arena surfaces were machine-validated
for lightness band, chroma floor, colour-vision separation and contrast. Rules held
across every chart:

- one y-scale, never a second axis; different units get their own chart, and the
  "compare to previous period" series shares the scale it is compared against
- colour follows the entity, never its rank — filtering a team never repaints the others
- ordered stages (the registration funnel, the heatmap) use a single-hue ramp,
  not categorical hues
- a legend for every multi-series chart, plus a table view so no value is reachable
  by colour or hover alone

## Demo data

6 teams (10U Blue, 11U Select, 12U Blue, 13U Elite, 14U Elite, Lady Cavs), 128 active
players, 8 staff, 4 venues, a full season of games and recurring practices, 34 open
registrations, 96 payment records and broadcast history — all generated
deterministically, so the demo is identical on every load.

One game is **live** on page load (13U Elite vs Chatsworth Select, 42–38, Q3) with a
running clock, so the dashboard and Live Games always have something to show.
