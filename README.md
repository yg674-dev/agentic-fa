# Agentic FA — AI Deal Copilot

An AI-native deal intelligence platform for VC investors powered by Claude claude-sonnet-4-6.

## Features

- **Thesis Alignment Scoring** — Score any deal 0–100 against your fund thesis with factor breakdown
- **IC Memo Generation** — One-click full investment committee memos in markdown
- **Deck Analysis** — Paste pitch deck text and auto-extract structured deal data
- **Why Now Signals** — Identify macro, tech, and regulatory tailwinds for any deal
- **Deal Pipeline** — Track all scored deals with status management

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your Anthropic API key:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Usage

1. **Configure Fund Thesis** — Go to "Score Deal" and set your sector focus, stage, geography, check size, and thematic focus.
2. **Score a Deal** — Enter company details and click "Score Deal" to get a thesis alignment score.
3. **Generate IC Memo** — From the scoring results, click "Generate IC Memo" for a full investment memo.
4. **Manage Pipeline** — View all scored deals in the Pipeline tab, update statuses, and track your deal flow.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/score` | Thesis alignment scoring |
| POST | `/api/memo` | IC memo generation |
| POST | `/api/analyze` | Pitch deck text analysis |
| POST | `/api/signal` | "Why now" signal engine |

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES2022+)
- **Backend**: Node.js 20 + Express.js
- **AI**: Anthropic Claude claude-sonnet-4-6 via `@anthropic-ai/sdk`
- **Storage**: In-memory + localStorage
