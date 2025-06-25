# Job Search Engine - Next.js

A modern, AI-powered job search engine built with Next.js, TypeScript, and Prisma.

## Features

- 🔍 AI-powered job search using Exa API
- 🤖 Intelligent job matching with OpenAI
- 📊 Job scoring based on user preferences
- 💾 Save and track job applications
- 📈 Dashboard with application status tracking
- 🎨 Modern UI with Tailwind CSS and Radix UI
- 🚀 Server-side rendering with Next.js 14

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: SQLite with Prisma ORM
- **APIs**: Exa (job search), OpenAI (AI analysis)
- **State Management**: React Hooks
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Exa API key

### Installation

1. Clone the repository:
```bash
cd job-search-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```
DATABASE_URL="file:./dev.db"
EXA_API_KEY="your-exa-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

5. Set up the database:
```bash
npx prisma db push
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard page
│   ├── search/         # Search page
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── ui/            # UI components
│   ├── JobCard.tsx    # Job card component
│   └── SearchForm.tsx # Search form component
├── lib/               # Utilities and libraries
│   ├── job-search.ts  # Job search logic
│   ├── database.ts    # Prisma client
│   └── utils.ts       # Helper functions
└── types/             # TypeScript types
```

## API Routes

- `POST /api/search` - Search for jobs
- `GET /api/jobs` - Get saved jobs
- `POST /api/saved-jobs` - Save a job
- `PUT /api/saved-jobs` - Update saved job status
- `DELETE /api/saved-jobs` - Remove saved job

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Open Prisma Studio
npm run db:studio
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Environment Variables

- `DATABASE_URL` - Database connection string
- `EXA_API_KEY` - Exa API key for job search
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NEXTAUTH_URL` - (Optional) For authentication
- `NEXTAUTH_SECRET` - (Optional) For authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT