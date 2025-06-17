import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';
import { drawLeaderboard } from '../utils/leaderboardUtils.js';

const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Mostrar los 10 mejores usuarios por XP en el servidor actual');

const leaderboardCommand = async (interaction) => {
  await interaction.deferReply();

  // Fetch guild info
  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('id, name')
    .eq('id', interaction.guildId)
    .single();

  if (guildError || !guild) {
    await interaction.editReply({
      content: 'No se pudo obtener la información del servidor.',
    });
    return;
  }

  // Fetch top 10 users by global_level in this guild
  const { data: leaderboard, error: leaderboardError } = await supabase
    .from('user_guild')
    .select('users(id, username, avatar, global_xp, global_level)')
    .order('users(global_level)', { ascending: false })
    .eq('guild_id', interaction.guildId)
    .limit(10);

  if (leaderboardError || !leaderboard) {
    await interaction.editReply({
      content: 'No se pudo obtener la información del leaderboard.',
    });
    return;
  }

  // Log all guild members (cache only)
  console.log(interaction.guild.members.cache.map(member => `${member.user.tag} (${member.id})`));

  // Prepare user data for leaderboard image
  const users = [];
  for (const entry of leaderboard) {
    const u = entry.users;
    // Ensure userId is always a string
    const userId = typeof u.id === 'string' ? u.id : String(u.id);
    let member = null;
    let userObj = null;

    try {
      member = await interaction.guild.members.fetch(userId);
      console.log(`Member found: ${member.user.tag} (${member.id})`);
    } catch (err) {
      console.log(`Member not found in guild for ID: ${userId}`);
      member = null;
    }
    if (!member) {
      try {
        userObj = await interaction.client.users.fetch(userId);
        if (userObj) {
          console.log(`User found globally: ${userObj.tag} (${userObj.id})`);
        }
      } catch (err) {
        console.log(`User not found globally for ID: ${userId}`);
        userObj = null;
      }
    }
    let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    if (member && member.user) {
      avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    } else if (userObj) {
      avatarUrl = userObj.displayAvatarURL({ extension: 'png', size: 256 });
    }

    users.push({
      name: u.username,
      avatarUrl,
      global_xp: u.global_xp,
      global_level: u.global_level,
    });
  }

  // Generate leaderboard image
  const { buffer, filename } = await drawLeaderboard(users);

  // Create attachment
  const attachment = new AttachmentBuilder(buffer, { name: filename });

  await interaction.editReply({
    content: `${guild.name}'s XP leaderboard`,
    files: [attachment],
  });
};

leaderboardCommand.data = data;

export default leaderboardCommand;