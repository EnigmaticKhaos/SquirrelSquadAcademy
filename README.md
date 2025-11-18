# SquirrelSquad Academy

A comprehensive gamified learning platform with social media features, AI-generated courses, automated AI grading, and subscription-based monetization.

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- Zustand/Redux
- Socket.io Client

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Socket.io
- Passport.js (OAuth)

### Services
- OpenAI API
- Resend (Email)
- Stripe (Payments)
- Cloudinary (Media Storage)
- AWS S3 (File Storage)
- GitHub API

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd SquirrelSquadAcademy
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables

Backend (.env):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/squirrelsquadacademy
JWT_SECRET=your_jwt_secret_key_here
# ... other environment variables
```

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# ... other environment variables
```

5. Run the development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Project Structure

```
squirrelsquadacademy/
├── frontend/          # Next.js application
├── backend/           # Express API
├── shared/            # Shared types/utilities
└── docs/              # Documentation
```

## Features

- User authentication (email, OAuth, 2FA)
- AI-generated courses
- Automated AI grading
- Gamification (XP, achievements, badges)
- Social media features
- Direct messaging
- Project sharing
- Learning analytics
- And much more...

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Frontend (Vercel):**
```bash
vercel --prod
```

**Backend (Railway):**
- Connect GitHub repository
- Configure environment variables
- Deploy automatically on push

**Backend (Render):**
- Connect GitHub repository
- Configure environment variables
- Deploy automatically on push

## License

ISC

