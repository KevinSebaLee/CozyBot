import { handleXPMessage } from '../utils/xp/xpHandleMessage.js';
import { createUsersCanva } from '../utils/shipUtils.js';
import { joinImagesSideBySide } from '../utils/matchUtils.js';

export default function (client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    handleXPMessage(message);

    const { content, mentions, author, channel } = message;

    if (content.startsWith('cb!fate')) {
      // Get mentioned users and/or text usernames
      const args = content.split(' ').slice(1);
      let users = Array.from(message.mentions.users.values());

      // Try to find users by username if not enough mentions
      if (users.length < 2 && args.length >= 1) {
        // Remove mention syntax from args
        const filteredArgs = args.filter(arg => !arg.startsWith('<@'));
        // Try to find users by username (case-insensitive, fuzzy match)
        for (let i = 0; i < filteredArgs.length && users.length < 2; i++) {
          const username = filteredArgs[i].trim().toLowerCase();
          let found = message.guild.members.cache.find(
            m => m.user.username.toLowerCase() === username
          );
          if (!found) {
            found = message.guild.members.cache.find(
              m => m.user.username.toLowerCase().includes(username)
            );
          }
          if (found && !users.some(u => u.id === found.user.id)) {
            users.push(found.user);
          }
        }
      }

      const mention = users[0];
      const secondMention = users[1];

      if (!mention) {
        return message.reply('Por favor, menciona a alguien o escribe su nombre para el fate.');
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

    if (content.startsWith('cb!choose')) {
      const options = content.split(' ').slice(1).join(' ').split(',');
      if (options.length < 2) {
        return message.reply('Por favor, proporciona al menos dos opciones separadas por comas.');
      }
      const choice = options[Math.floor(Math.random() * options.length)].trim();
      return channel.send(`Mi eleccion es **${choice}**! Espero que te guste!`);
    }

    if (content.startsWith('cb!ship')) {
      // Get mentioned users and/or text usernames
      const args = content.split(' ').slice(1);
      let users = Array.from(message.mentions.users.values());

      if (users.length < 2 && args.length >= 2) {
        // Remove mention syntax from args
        const filteredArgs = args.filter(arg => !arg.startsWith('<@'));
        // Try to find users by username (case-insensitive, fuzzy match)
        for (let i = 0; i < filteredArgs.length && users.length < 2; i++) {
          const username = filteredArgs[i].trim().toLowerCase();
          // Try exact match first
          let found = message.guild.members.cache.find(
            m => m.user.username.toLowerCase() === username
          );
          if (!found) {
            found = message.guild.members.cache.find(
              m => m.user.username.toLowerCase().includes(username)
            );
          }
          if (found && !users.some(u => u.id === found.user.id)) {
            users.push(found.user);
          }
        }
      }

      if (users.length < 2) {
        return message.reply('Por favor, menciona a dos usuarios o escribe sus nombres para hacer un ship.');
      }

      const userA = users[0];
      const userB = users[1];

      if (userA.id === userB.id) {
        return message.reply('No puedes hacer ship contigo mismo.');
      }

      const percentage = Math.floor(Math.random() * 101);

      // Ship name logic
      const shipName =
        userA.username.slice(0, Math.ceil(userA.username.length / 2)) +
        userB.username.slice(Math.floor(userB.username.length / 2));

      // Compatibility message
      let compatibilityMessage;
      if (percentage < 20) {
        compatibilityMessage = "😬 ¡No parece que sean compatibles! Pero nunca digas nunca.";
      } else if (percentage < 40) {
        compatibilityMessage = "🙂 Hay algo de chispa, pero necesitan trabajar en la relación.";
      } else if (percentage < 60) {
        compatibilityMessage = "😊 ¡Podría funcionar! Hay potencial aquí.";
      } else if (percentage < 80) {
        compatibilityMessage = "😍 ¡Gran compatibilidad! Se ven muy bien juntos.";
      } else {
        compatibilityMessage = "💖 ¡Almas gemelas! ¡Están hechos el uno para el otro!";
      }

      // Get avatar URLs
      const avatarA = userA.displayAvatarURL({ extension: "png", size: 256 });
      const avatarB = userB.displayAvatarURL({ extension: "png", size: 256 });

      const compatibilityText = `Nombre del ship: **${shipName}**\nLa compatibilidad es de un **${percentage}%**.`;

      try {
        const shipImageBuffer = await createUsersCanva(avatarA, avatarB, percentage);

        const { EmbedBuilder, AttachmentBuilder } = await import('discord.js');
        const embed = new EmbedBuilder()
          .setColor("#ff69b4")
          .setTitle(compatibilityMessage)
          .setImage("attachment://ship.png");

        const attachment = new AttachmentBuilder(shipImageBuffer, { name: "ship.png" });

        await message.channel.send({ content: compatibilityText, embeds: [embed], files: [attachment] });
      } catch (err) {
        console.error("Error enviando el ship:", err);
        return message.reply("No se pudo enviar el ship. Inténtalo de nuevo más tarde.");
      }
    }

    if (content.startsWith('cb!match')) {
      // Get mentioned users and/or text usernames
      const args = content.split(' ').slice(1);
      let users = Array.from(message.mentions.users.values());

      if (users.length < 2 && args.length >= 2) {
        // Remove mention syntax from args
        const filteredArgs = args.filter(arg => !arg.startsWith('<@'));
        // Try to find users by username (case-insensitive, fuzzy match)
        for (let i = 0; i < filteredArgs.length && users.length < 2; i++) {
          const username = filteredArgs[i].trim().toLowerCase();
          // Try exact match first
          let found = message.guild.members.cache.find(
            m => m.user.username.toLowerCase() === username
          );
          if (!found) {
            found = message.guild.members.cache.find(
              m => m.user.username.toLowerCase().includes(username)
            );
          }
          if (found && !users.some(u => u.id === found.user.id)) {
            users.push(found.user);
          }
        }
      }

      if (users.length < 2) {
        return message.reply('Por favor, menciona a dos usuarios o escribe sus nombres para hacer un match.');
      }
      const userA = users[0];
      const userB = users[1];

      // Get avatar URLs
      const avatarA = userA.displayAvatarURL({ extension: "png", size: 256 });
      const avatarB = userB.displayAvatarURL({ extension: "png", size: 256 });

      try {
        const matchImageBuffer = await joinImagesSideBySide(avatarA, avatarB);

        const { EmbedBuilder, AttachmentBuilder } = await import('discord.js');
        const embed = new EmbedBuilder()
          .setColor("#00bfff")
          .setTitle("¡Hermoso match!")
          .setImage("attachment://match.png");

        const attachment = new AttachmentBuilder(matchImageBuffer, { name: "match.png" });

        await message.channel.send({ embeds: [embed], files: [attachment] });
      } catch (err) {
        console.error("Error enviando el match:", err);
        return message.reply("No se pudo crear el match. Inténtalo de nuevo más tarde.");
      }
    }
  });
}
