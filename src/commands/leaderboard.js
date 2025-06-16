import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';
import { drawLeaderboard } from '../utils/leaderboardUtils.js';

const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Mostrar los 10 mejores usuarios por XP en el servidor actual');

const leaderboardCommand = async (interaction) => {
  await interaction.deferReply();

  const { data: guilds, error: guildError } = await supabase
    .from('guilds')
    .select('id, name')
    .eq('id', interaction.guildId)
    .single();

  console.log(guilds.id, guilds.name);
  
  const { data: leaderboard, error } = await supabase
    .from('user_guild')
    .select('users(id, username, avatar, global_xp, global_level)')
    .order('users(global_xp)', { ascending: false })
    .eq('guild_id', interaction.guildId)
    .limit(10);

  if (error || guildError) {
    await interaction.editReply({
      content: 'Failed to fetch leaderboard data.',
    });
    return;
  }

  const users = [];
  for (let i = 0; i < leaderboard.length; i++) {
    const u = leaderboard[i].users;

    let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    try {
      if (u.id) {
        const userObj = await interaction.client.users.fetch(u.id);
        if (userObj) {
          avatarUrl = userObj.displayAvatarURL({ format: 'png', size: 256 });
        }
      }
    } catch (e) {
      console.error(`Failed to fetch Discord user for user ${u.id}:`, e);
    }
    users.push({
      name: u.username,
      avatarUrl,
      global_xp: u.global_xp,
      global_level: u.global_level,
    });
  }

  // Draw the leaderboard image
  const { buffer, filename } = await drawLeaderboard(users);

  // Send as attachment
  const attachment = new AttachmentBuilder(buffer, { name: filename });

  await interaction.editReply({
    content: `${guilds.name}'s XP leaderboard`,
    files: [attachment],
  });
};

leaderboardCommand.data = data;

export default leaderboardCommand;