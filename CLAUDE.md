# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ricky Botty is a Discord bot for managing the Output Racing League (ORL), an iRacing sim racing league. It handles member applications, onboarding, session announcements, stats, car numbers, and league administration.

## Running the Bot

```bash
node index.js                    # Start the Discord bot
node deploy-commands.js          # Register/update slash commands with Discord
node bin/session.js              # Run automated session announcement (also available as `npx session`)
```

There are no build steps, linting, or test suites configured.

## Architecture

**Entry point:** `index.js` — Bootstraps the Discord client, dynamically loads all commands from `src/commands/` and event handlers from `src/events/`, then connects to Discord.

### Source Layout (`src/`)

- **commands/** — Discord slash commands (one file per command). Each exports `data` (SlashCommandBuilder) and `execute(interaction)`. Admin commands check for the admin role before executing.
- **events/** — Discord event handlers. Each exports `name`, optionally `once`, and `execute()`. Key handler: `guildMemberAdd.js` runs the full new-member onboarding flow (welcome DM → iRacing account linking → car number selection → nickname update → welcome post).
- **actions/** — Data mutation operations that coordinate across services (e.g., linking Discord to iRacing, updating car numbers in both iRacing and Contentful).
- **embeds/** — Discord embed builders that format data for display (profiles, stats, session details, driver lists, rules).
- **replies/** — Response templates (currently just application replies).
- **lib/** — Service clients, each in its own subdirectory:
  - `discord/` — Discord.js client setup with intents
  - `iracing-data-api/` — Read-only iRacing API (members-ng.iracing.com) for league data, stats, sessions
  - `iracing-membersite-api/` — Legacy iRacing API with write access (invites, number changes, member removal). Uses SHA256 password hashing and cookie-based auth with automatic re-auth on 401.
  - `contentful/` — Read-only Contentful CMS client
  - `contentful-management/` — Contentful Management API for writes
  - `google/` — Google Sheets (application tracking) and Gmail (invitation emails)
- **constants.json** — League IDs and time-of-day display mappings.

### CLI Utilities (`bin/`)

- `session.js` — Fetches today's scheduled sessions from iRacing, builds embeds, posts to announcements channel. Has optional Claude API integration for generating creative announcements.
- `email.js` — Gmail OAuth setup and sending invitation emails.
- `lookup.js`, `resolveApplicants.js`, `sof.js` — Ad-hoc data utilities.

### Configuration

- **config.json** — Discord IDs (guild, channels, roles, webhooks). Not secrets, but Discord-specific identifiers.
- **.env** — All secrets: `DISCORD_ACCESS_TOKEN`, `CONTENTFUL_ACCESS_TOKEN`, `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`, `IRACING_USERNAME`, `IRACING_PASSWORD`, plus MySQL credentials.

## Module System

The project has mixed module systems despite `"type": "module"` in package.json. `index.js`, `deploy-commands.js`, and most `src/` files use CommonJS (`require`/`module.exports`). Files in `src/lib/` and `bin/` use ES modules (`import`/`export`). Follow the convention of whichever file you're modifying.

## Data Flow

Applications: Google Sheets → Discord bot review → iRacing league invite → Contentful driver profile → Gmail welcome email.

Member onboarding: Discord join event → DM interaction → link iRacing account (Contentful + iRacing API) → assign car number → update Discord nickname.

Session announcements: iRacing Data API (schedule) → embed builder → Discord announcements channel.

## Adding a New Command

1. Create `src/commands/<name>.js` exporting `data` (SlashCommandBuilder) and `execute(interaction)`.
2. Run `node deploy-commands.js` to register it with Discord.
3. The bot auto-discovers it on next startup (no imports needed in index.js).
