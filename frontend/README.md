# SquirrelSquad Academy Frontend

A modern Next.js frontend for the SquirrelSquad Academy learning platform.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Query** (TanStack Query) - for data fetching
- **Zustand** - for state management
- **Axios** - for API calls
- **Socket.io Client** - for real-time features

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory (App Router)
│   ├── (auth)/            # Auth route group
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── courses/           # Courses pages
│   │   ├── [id]/          # Course detail page
│   │   └── page.tsx       # Courses listing
│   ├── dashboard/         # User dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── providers.tsx      # React Query provider
├── components/            # Reusable components
│   └── layout/
│       └── Header.tsx     # Navigation header
├── lib/                   # Utility libraries
│   ├── api.ts             # Axios API client
│   └── utils.ts           # Utility functions
├── stores/                # Zustand stores
│   └── authStore.ts       # Authentication state
└── types/                 # TypeScript types
    └── index.ts           # Shared types
```

## Features Implemented

### Authentication
- ✅ User login page
- ✅ User registration page
- ✅ Authentication state management with Zustand
- ✅ Protected routes
- ✅ Token-based authentication

### Pages
- ✅ Homepage with hero and features
- ✅ User dashboard with stats and enrolled courses
- ✅ Courses listing page with filters
- ✅ Course detail page with enrollment

### UI Components
- ✅ Responsive header/navigation
- ✅ Modern, clean design with Tailwind CSS
- ✅ Loading states
- ✅ Error handling

### Infrastructure
- ✅ API client with interceptors
- ✅ React Query setup for data fetching
- ✅ Zustand store for global state
- ✅ TypeScript types for data models

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# API URL - Backend API endpoint
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Frontend URL (for OAuth callbacks)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Stripe Publishable Key (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

To continue development, consider adding:

1. **Additional Pages:**
   - Profile page
   - Settings page
   - Learning paths
   - Leaderboard
   - Forum/community pages

2. **Course Features:**
   - Course player/lesson viewer
   - Assignment submissions
   - Progress tracking
   - Certificates

3. **Components:**
   - Reusable UI components (buttons, cards, modals)
   - Form components
   - Loading skeletons
   - Toast notifications

4. **Features:**
   - Real-time notifications (Socket.io)
   - Search functionality
   - Filters and sorting
   - Pagination
   - Dark mode

## Development

The frontend is built with Next.js App Router and follows modern React patterns:

- Server and Client Components
- Client-side state with Zustand
- Server-side data fetching when needed
- API routes for backend communication

Make sure the backend API is running on the port specified in `NEXT_PUBLIC_API_URL` (default: http://localhost:5000).
