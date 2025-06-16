import supabase from '../database/supabaseClient.js';
import xpCommand from '../commands/xp.js';
import resetCommand from '../commands/reset.js';
import leaderboardCommand from '../commands/leaderboard.js';

export default function (client) {
  client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Loop through every guild the bot is in
    for (const [guildId, guild] of client.guilds.cache) {
      await guild.members.fetch();

      const { data, error } = await supabase
        .from('guilds')
        .upsert([
          {
            id: guildId,
            name: guild.name,
            icon: guild.icon
          }
        ])
        .select();

      if (error) {
        console.error(`Error upserting guild ${guildId}:`, error);
      }

      for (const [memberId, member] of guild.members.cache) {
        const { user } = member;

        // Upsert user
        await supabase
          .from('users')
          .upsert([
            {
              id: user.id,
              username: user.username,
              discriminator: user.discriminator,
              avatar: user.avatar,
            }
          ]);

        // Upsert user_guild relationship
        await supabase
          .from('user_guild')
          .upsert([
            {
              user_id: user.id,
              xp: user.global_xp,
              level: user.global_level,
              guild_id: guildId
            }
          ]);
      }
    }

    // Register all slash commands
    const commands = [
      xpCommand.data,
      resetCommand.data,
      leaderboardCommand.data,
    ].filter(Boolean);

    for (const guild of client.guilds.cache.values()) {
      await guild.commands.set(commands);
    }
  });
}