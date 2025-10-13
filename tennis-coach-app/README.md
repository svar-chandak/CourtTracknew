# CourtTrack - Tennis Coach Management Web App

A comprehensive web application for high schoo tennis coaches to manage teams, create collaborative tournaments, and coordinate with other coaches. Built with Next.js 14, Supabase, and modern web technologies.

## 🎯 Key Features

### Core Functionality
- **Team Management**: Add and manage players, track roster information
- **Match Scheduling**: Schedule matches against other schools
- **Tournament System**: Create and join collaborative tournaments (key differentiator)
- **Lineup Management**: Build match lineups with drag-and-drop interface
- **Real-time Updates**: Live tournament brackets and match updates
- **Coach Network**: Connect with other coaches and share team codes

### Tournament System (Core Differentiator)
- **Multi-format Support**: Single elimination, round robin, dual matches
- **Team Code Integration**: Coaches join tournaments with unique codes
- **Smart Bracket Generation**: Auto-create fair brackets
- **Real-time Updates**: Live bracket updates for all participants
- **Tournament Chat**: Communication between participating coaches

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for global state
- **Real-time**: Supabase Realtime subscriptions
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives via shadcn/ui
- **Icons**: Lucide React icons
- **Notifications**: React Hot Toast

### Backend & Database
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Supabase Storage for team photos
- **Real-time**: Supabase Realtime for live tournament updates

### Additional Tools
- **Email**: Resend for notifications
- **Push Notifications**: Web Push API
- **Deployment**: Netlify
- **Monitoring**: Sentry (optional)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tennis-coach-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The app uses a comprehensive database schema with the following key tables:

- **coaches**: Coach profiles and authentication
- **teams**: Team information and records
- **players**: Individual player profiles
- **matches**: Scheduled matches and results
- **tournaments**: Tournament information and settings
- **tournament_teams**: Tournament participants
- **tournament_matches**: Tournament bracket matches
- **match_results**: Individual match results (singles/doubles)
- **lineups**: Team lineups for matches
- **challenge_matches**: Challenge match tracking

See `supabase-schema.sql` for the complete schema with relationships and RLS policies.

## 🎨 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── team/
│   ├── matches/
│   ├── tournaments/
│   ├── lineups/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── dashboard/
│   ├── team/
│   ├── tournaments/
│   ├── matches/
│   └── layout/
├── lib/
│   ├── supabase-client.ts
│   ├── supabase-server.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validations.ts
└── stores/
    ├── auth-store.ts
    ├── team-store.ts
    └── tournament-store.ts
```

## 🔧 Key Features Implementation

### Authentication System
- Supabase Auth with email/password
- Protected routes with middleware
- Coach registration with school verification
- Auto-generate unique 6-digit team codes

### Dashboard
- Today's schedule widget
- Quick actions (Start Match, Send Update, Create Tournament)
- Recent activity feed
- Team performance summary
- Upcoming tournaments

### Team Management
- Player CRUD operations with forms
- Team roster display with skill levels
- Position preference tracking
- Contact information management

### Tournament System
- Tournament creation wizard
- Team code joining system
- Bracket generation algorithms
- Real-time bracket updates
- Tournament chat functionality

## 🚀 Deployment

### Netlify Deployment

1. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`
   - The `netlify.toml` file is already configured with the Netlify Next.js plugin

3. **Set Environment Variables**
   Add all environment variables in Netlify dashboard (Site settings > Environment variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your app

### Environment Variables for Production
Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## 📱 Real-time Features

The app uses Supabase Realtime for live updates:

```typescript
// Tournament updates
supabase
  .channel('tournament_updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tournament_matches' },
    (payload) => updateTournamentBracket(payload)
  )
  .subscribe()

// Match score updates
supabase
  .channel('match_scores')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'matches' },
    (payload) => updateLiveScores(payload)
  )
  .subscribe()
```

## 🎯 User Experience Flows

### New Coach Onboarding
1. Register with email and school information
2. Verify email address
3. Auto-generated team code
4. Add players to roster
5. Start scheduling matches or creating tournaments

### Tournament Creation
1. Set tournament details (name, type, max teams)
2. Share tournament code
3. Teams join using code
4. Generate bracket when full
5. Play matches and track results

### Daily Usage
1. Check dashboard for today's schedule
2. Update lineup for upcoming matches
3. Enter scores during/after matches
4. Send updates to team
5. Join or create tournaments

## 🔐 Security

- Row Level Security (RLS) policies in Supabase
- Input validation on all forms with Zod
- Secure file uploads for team photos
- Rate limiting on tournament creation
- Protected routes with authentication

## 📈 Performance

- Optimized database queries with proper indexing
- React.memo for expensive components
- Proper loading states and error handling
- Image optimization for team photos
- Bundle size optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@courttrack.app or create an issue in the GitHub repository.

## 🎉 Acknowledgments

- Built with Next.js and Supabase
- UI components from shadcn/ui
- Icons from Lucide React
- Styling with Tailwind CSS

---

**CourtTrack** - Making tennis team management effortless for coaches everywhere! 🎾