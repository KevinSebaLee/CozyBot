import { handleXPMessage } from '../utils/xpUtils.js';
import leaderboardCommand from '../commands/leaderboard.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    handleXPMessage(message);

    if (message.content.startsWith('cb!fate')) {
      const mention = message.mentions.users.first();
      if (!mention) {
        message.reply('Por favor, menciona a alguien para el fate.');
        return;
      }

      const author = message.author;
      if (mention.id === author.id) {
        message.reply('No puedes hacer fate contigo mismo.');
        return;
      }

      const responses = [
        'son amigos.',
        'son enemigos.',
        'son hermanos.',
        'son amantes.',
        'son casados.',
        'son compañeros de trabajo.',
        'son desconocidos.',
        'son socios de trabajo.',
        'son maestro y esclavo',
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      message.reply(`${author} y ${mention} ${response}`);
      return;
    }

    if(message.content.startsWith('cb!say')){
      const args = message.content.split(' ').slice(1);
      const text = args.join(' ');
      if (!text) {
        message.reply('Por favor, proporciona un mensaje para decir.');
        return;
      }
      message.channel.send(text);
      return;
    }

    if (message.author.bot) return;
  });
}