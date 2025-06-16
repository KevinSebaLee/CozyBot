import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import registerEvents from './src/events/index.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

registerEvents(client);

client.login(process.env.DISCORD_TOKEN);