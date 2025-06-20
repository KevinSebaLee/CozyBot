import { handleXPMessage } from '../utils/xpUtils.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    handleXPMessage(message);

    const { content, mentions, author, channel } = message;

    if (content.startsWith('cb!fate')) {
      const [mention, secondMention] = mentions.users.values();
      if (!mention) {
        return message.reply('Por favor, menciona a alguien para el fate.');
      }

      let fateAuthor = author;
      let fateMention = mention;

      // If there is a second mention, swap roles
      if (secondMention) {
        fateAuthor = mention;
        fateMention = secondMention;
      }

      if (fateMention.id === fateAuthor.id) {
        return message.reply('No puedes hacer fate contigo mismo.');
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
        'son prometidos por error'
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      return channel.send(`${fateAuthor} y ${fateMention} ${response}`);
    }

    if (content.startsWith('cb!say')) {
      const text = content.split(' ').slice(1).join(' ');
      if (!text) {
        return message.reply('Por favor, proporciona un mensaje para decir.');
      }
      await message.delete();
      return channel.send(text);
    }
  });
}
