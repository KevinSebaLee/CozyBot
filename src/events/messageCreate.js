import messageXp from '../commands/xp.js';
import { handleXPMessage } from '../utils/xpUtils.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    handleXPMessage(message); // Handle XP for all messages

    if (message.author.bot) return;
  });
}