import { SlashCommandBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';

const data = new SlashCommandBuilder()
  .setName('resetlevel')
  .setDescription('Reset a user\'s level to 0')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('The user to reset')
      .setRequired(true)
  );

const resetLevelCommand = async (interaction) => {
  const target = interaction.options.getUser('target');

  await supabase
    .from('users')
    .update({ global_level: 1, global_xp: 0 })
    .eq('id', target.id);

  await interaction.reply({
    content: `Level for ${target.tag} has been reset to 0.`,
    ephemeral: true
  });
};

resetLevelCommand.data = data;

export default resetLevelCommand;