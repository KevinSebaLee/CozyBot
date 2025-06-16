import messageXp from '../commands/xp.js';
import { handleXPMessage } from '../utils/xpUtils.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    handleXPMessage(message); // Handle XP for all messages

    if (message.author.bot) return;
    if (message.content.trim().toLowerCase() === 'xp' || message.content.trim().toLowerCase() === '!xp') {
      await messageXp(message); // Only messages
      return;
    }
  });
}