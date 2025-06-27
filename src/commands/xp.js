import { SlashCommandBuilder } from 'discord.js';
import { getUserXPData, getUserRankPosition, getUserGuild, generateXPWidget } from '../services/xpService.js';

const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Mostrar tu XP y nivel')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('El usuario del que quieres ver el XP')
      .setRequired(false)
  );

const xpCommand = async (interaction) => {
  const user = interaction.options.getUser('user') || interaction.user;

  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('xpCommand called with non-Interaction:', interaction);
    return;
  }

  const userXP = await getUserXPData(user.id);
  if (!userXP) {
    await interaction.reply({ content: 'You have no XP yet. Start chatting to earn some!', flags: 64 });
    return;
  }

  const position = await getUserRankPosition(userXP.global_level, userXP.global_xp);
  const userGuild = await getUserGuild(interaction.guildId);

  console.log(position, userGuild?.id);

  try {
    const attachment = await generateXPWidget(user, userXP, position, userGuild?.id || null);
    await interaction.reply({ files: [attachment] });
  } catch (err) {
    if (!interaction.replied && !interaction.deferred) {
      console.log(err);
      await interaction.reply({ content: 'Could not generate XP widget image.', flags: 64 });
    } else if (typeof interaction.editReply === 'function') {
      console.log(err)
      await interaction.editReply({ content: 'Could not generate XP widget image.' });
    } else {
      console.error('Interaction does not support editReply:', interaction);
    }
  }
};

xpCommand.data = data;
export default xpCommand;