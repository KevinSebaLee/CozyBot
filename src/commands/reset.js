import { SlashCommandBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';

const data = new SlashCommandBuilder()
  .setName('resetlevel')
  .setDescription('Reinicia el nivel de un usuario a 0')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('El nombre del usuario cuyo nivel se reiniciará')
      .setRequired(true)
  );

const resetLevelCommand = async (interaction) => {
  const target = interaction.options.getUser('target');

  await supabase
    .from('users')
    .update({ global_level: 1, global_xp: 0 })
    .eq('id', target.id);

  await interaction.reply({
    content: `Nivel para ${target.tag} se reinicio a 0.`,
    ephemeral: true
  });
};

resetLevelCommand.data = data;

export default resetLevelCommand;