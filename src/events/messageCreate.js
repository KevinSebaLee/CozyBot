import messageXp from '../commands/xp.js';
import { handleXPMessage } from '../utils/xpUtils.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    // handleXPMessage(message);

    if (message.author.bot) return;
  });
}