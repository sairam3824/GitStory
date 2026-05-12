# GitStory

GitStory turns any public GitHub profile into a beautiful, shareable developer story page.

Users enter a GitHub username, the backend fetches public GitHub profile data, OpenAI generates a narrative, and the frontend renders an interactive career story with a unique URL.

## Features

- GitHub username input and loading flow
- Public GitHub API integration for profile, repositories, and recent activity
- OpenAI-powered narrative generation with `gpt-4o`
- Replit DB caching with local file fallback for non-Replit development
- Shareable story route at `/story/:username`
- Explore page populated only by generated stories
- Regenerate support to bypass cache
- Responsive dark UI with Replit orange accents
- Open Graph meta tags for story routes

## Tech Stack

- React
- Tailwind CSS
- Node.js
- Express
- OpenAI API
- Replit DB

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Set your OpenAI key:

```bash
OPENAI_API_KEY=your_openai_api_key
```

On Replit, add `OPENAI_API_KEY` in Secrets. Replit DB is used automatically when `REPLIT_DB_URL` is available. Outside Replit, GitStory uses `.gitstory-cache.json` as a local cache.

### 3. Run development

```bash
npm run dev
```

Frontend: `http://127.0.0.1:5173`

Backend: `http://127.0.0.1:3001`

In development, Vite proxies `/api/*` requests to the Express server.

### 4. Build production

```bash
npm run build
npm run start
```

Production app: `http://127.0.0.1:3001`

## Scripts

- `npm run dev`: run Vite and Express together
- `npm run client`: run the Vite frontend
- `npm run server`: run the Express API
- `npm run build`: build the frontend for production
- `npm run start`: serve the production app
- `npm run lint`: run ESLint

## API

### `GET /api/health`

Returns service health.

### `GET /api/story/:username`

Returns a generated or cached GitStory for a GitHub username.

Query params:

- `regenerate=1`: bypass cache and generate a fresh story

### `GET /api/explore`

Returns generated story summaries for the Explore page.

## Deployment Notes

For Replit:

1. Add `OPENAI_API_KEY` in Secrets.
2. Run `npm install`.
3. Run `npm run build`.
4. Start with `npm run start`.

The server uses `PORT` from the environment when available.

## Roadmap

- [ ] PDF Export for stories
- [ ] Custom themes (Classic, Cyberpunk, Minimal)
- [ ] Integration with more social platforms
- [ ] Public leaderboard for most starred developers

## License

MIT
