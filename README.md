# TravioAfrica Admin Dashboard

A production-ready, scalable admin dashboard for a Travel and Tour Company built with React 19, Vite, Tailwind CSS, and modern tooling.

## Features

### Core Pages (10 Navigation Items)
- **Dashboard** — Revenue stats, booking trends, quick action deep-links, recent bookings, top tours
- **Bookings** — Viator-style multi-select status filters, date range picker, quick tabs, URL query state sync
- **Products** — Grid/table toggle view, 7-step product creation wizard with progress bar
- **Availability** — Month/Week/Day calendar views, color-coded availability, block/unblock dates
- **Performance** — Revenue charts, booking funnel, top tours analytics, category breakdown
- **Reviews** — Moderation tabs (Pending, Approved, Flagged, Replied, Unreplied), approve/reject/flag actions
- **Finance** — Transactions, payouts, refunds, earnings breakdown with summary stats
- **Notifications** — Grouped by date, read/unread states, mark all read, quick actions
- **User Management** — Role-based user table with suspend/activate, invite admin modal
- **Settings** — Company profile, notification preferences, API keys, integrations, audit log

### Design System
- **Primary Brand Color:** `#044b3b` (Deep Forest Green)
- **Font:** DM Sans (400, 500, 700)
- **Layout:** Dark sidebar (`#262a2e`) + white content area (Nubra UI + Emilus inspired)
- **Shadows:** Soft Nubra-style tinted shadows
- **Cards:** White background, 8px border radius, subtle border

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS v4 | Utility-first Styling |
| React Router v7 | Client-side Routing |
| TanStack Query | Server State Management |
| Zustand | Client State Management |
| TanStack Table | Data Tables (sort/filter/page) |
| Recharts | Data Visualization |
| Axios | HTTP Client |
| date-fns | Date Formatting |
| Sonner | Toast Notifications |
| Lucide React | Icons |

## Project Structure

```
src/
├── app/                  # App entry, routes, providers
├── components/
│   ├── ui/               # shadcn/ui base components (ready for install)
│   ├── layout/           # Sidebar, Header, AppShell
│   └── shared/           # Reusable: DataTable, StatusBadge
├── features/             # Domain-specific modules
│   ├── dashboard/
│   ├── bookings/
│   ├── products/         # + 7-step wizard components
│   ├── availability/
│   ├── performance/
│   ├── reviews/
│   ├── finance/
│   ├── notifications/
│   ├── users/
│   └── settings/
├── hooks/                # Custom React hooks
├── lib/                  # Utils, constants, axios config
├── stores/               # Zustand stores (auth, sidebar, theme)
└── types/                # TypeScript definitions
```

## Getting Started

### Prerequisites
- Node.js 20+ (with npm 10+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd FrontDash

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=https://expedition-go-backend-v2.onrender.com
```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## API Integration

The dashboard is configured to connect to the Expedition Go Tours API:
- **Base URL:** `https://expedition-go-backend-v2.onrender.com`
- **Auth:** Bearer JWT via Axios interceptors
- **Swagger Docs:** https://expedition-go-backend-v2.onrender.com/api-docs

All API calls are centralized in `src/lib/axios.js` with:
- Automatic JWT token attachment
- 401 unauthorized handling (redirect to login)
- Base URL configuration

## Key Design Decisions

1. **Desktop Only** — Optimized for 1366px+ screens, no mobile breakpoint optimization
2. **Light Mode Default** — White backgrounds with dark sidebar for contrast
3. **No Login Screen** — Internal tool assumption, JWT injected via auth store
4. **Mock Data** — All pages populated with realistic demo data for immediate testing
5. **URL Query State** — Bookings page filters are shareable via URL parameters (Viator-style)

## Development Status

| Phase | Status |
|-------|--------|
| Phase 1: Foundation | Complete |
| Phase 2: Bookings | Complete |
| Phase 3: Products + Wizard | Complete |
| Phase 4: Availability | Complete |
| Phase 5: Performance + Reviews | Complete |
| Phase 6: Finance + Notifications | Complete |
| Phase 7: Users + Settings | Complete |
| Phase 8: Dashboard + Polish | Complete |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

Private — For TravioAfrica internal use.

## Author

TravioAfrica Development Team
