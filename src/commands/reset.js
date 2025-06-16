import { SlashCommandBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';

export const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Reset your XP and level to default values.');

export default async function execute(interaction) {
  const userId = interaction.user.id;
  const { error } = await supabase
    .from('users')
    .update({ global_xp: 0, global_level: 1 })
    .eq('id', userId);

  if (error) {
    return interaction.reply({ content: 'An error occurred while resetting your XP.', ephemeral: true });
  }

  interaction.reply({ content: 'Your XP has been reset to 0 and your level to 1.', ephemeral: true });
}