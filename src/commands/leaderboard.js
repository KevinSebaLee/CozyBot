import { SlashCommandBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';

const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Displays the top users on the leaderboard.');

const leaderboardCommand = async (interaction) => {
    const { data: leaderboard, error } = await supabase
        .from('users')
        .select('username, global_xp')
        .order('global_xp', { ascending: false })
        .limit(10);

    if (error) {
        await interaction.reply({
            content: 'Failed to fetch leaderboard data.',
            ephemeral: true,
        });
        return;
    }

  let description = leaderboard
    .map((user, i) => `**${i + 1}. ${user.username}** - ${user.global_xp} points`)
    .join('\n');

  await interaction.reply({
    embeds: [
      {
        title: '🏆 Leaderboard',
        description: description || 'No data available.',
        color: 0xf1c40f,
      },
    ],
    ephemeral: false,
  });
};

leaderboardCommand.data = data;

export default leaderboardCommand;