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
                 derived analytics series
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
    overlays/    CommandPalette (⌘K), QuickCreate, RoleSwitcher, NotificationPanel,
                 CreateModals
  pages/         one file per module
```

**Connecting a backend later.** Every mutation goes through `AppStore` — `adjustScore`,
`createGame`, `moveRegistration`, `assignPlayerTeam`, `sendAnnouncement` and the rest.
Swapping local state for API calls is confined to that file; no page or component
reaches for data directly except through `useApp()` and the read-only lookups in
`data/mock.ts`.

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
