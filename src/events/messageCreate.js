import { handleXPMessage } from '../utils/xpUtils.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
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
        'son desconocidos.',
        'son socios de trabajo.',
        'son maestro y esclavo',
        'son crushes secretos.',
        'son almas gemelas.',
        'son mejores amigos.',
        'son complices de crimen.',
        'son egirl y simp.',
        'son duo bot.',
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      message.reply(`${author} y ${mention} ${response}`);
      return;
    }

    if (message.content.startsWith('cb!say')) {
      const args = message.content.split(' ').slice(1);
      const text = args.join(' ');
      if (!text) {
        message.reply('Por favor, proporciona un mensaje para decir.');
        return;
      }
      await message.delete();
      await message.channel.send(text);
      return;
    }
  });
}