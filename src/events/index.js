import ready from './ready.js';
import interactionCreate from './interactionCreate.js';
import messageCreate from './messageCreate.js';

export default function registerEvents(client) {
  ready(client);
  interactionCreate(client);
  messageCreate(client);
}