import messageXp from '../commands/xp.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.trim().toLowerCase() === 'xp' || message.content.trim().toLowerCase() === '!xp') {
      await messageXp(message); // Only messages
      return;
    }
  });
}