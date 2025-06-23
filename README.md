# CozyBot

CozyBot is a Discord bot developed by Cozy Haven to enhance your server experience with custom features, automation, and integrations.

## Features

- Built on [discord.js](https://discord.js.org/) v14.
- Modular event handling (see `/src/events`).
- Uses environment variables for configuration.
- Integrates with external APIs (see dependencies).
- Utilizes Supabase for data management.

## Join Our Community

Want to experience CozyBot live?  
**Join our Discord server:**  
👉 [discord.gg/cozyhaven](https://discord.gg/cozyhaven)

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A Discord Bot Token ([how to get one](https://discord.com/developers/applications))
- (Optional) Supabase project and credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KevinSebaLee/CozyBot.git
   cd CozyBot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root with your Discord bot token:
   ```
   DISCORD_TOKEN=your_token_here
   ```

4. (Optional) Add other environment variables as needed for APIs or Supabase.

### Running the Bot

- To start the bot:
  ```bash
  npm start
  ```
- For development with hot reload:
  ```bash
  npm run dev
  ```

## Project Structure

- `app.js` – Main entry point, initializes the Discord client and registers events.
- `src/events/` – Directory for event handlers (e.g., message, guild, etc.).
- `package.json` – Project metadata and dependencies.

## Dependencies

Key packages used:
- `discord.js` – Discord API wrapper
- `dotenv` – Environment variable loader
- `@supabase/supabase-js` – Database integration
- `axios`, `canvas`, `crypto`, and others

See [`package.json`](./package.json) for a full list.

## Contributing

Issues and pull requests are welcome! Please use the [issue tracker](https://github.com/KevinSebaLee/CozyBot/issues).

## License

ISC © La Cozy Gang

---
*This README was generated with the available project files and may need updates for new features or structural changes.*
