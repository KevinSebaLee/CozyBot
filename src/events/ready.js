import supabase from '../database/supabaseClient.js';
import xpCommand from '../commands/xp.js';
import resetCommand from '../commands/reset.js';
import leaderboardCommand from '../commands/leaderboard.js';
import ball8Command from '../commands/8ball.js';
import setXpCommand from '../commands/setXP.js';
import shipCommand from '../commands/ship.js';

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

      const { data: userLocalLevel, error: err } = await supabase
          .from('user_guild')
          .select('users(global_xp, global_level)')
          .eq('guild_id', guild.id)

      for (const [memberId, member] of guild.members.cache) {
        const { user } = member;
        let x = 0;

        console.log(`Processing user: ${user.username} (${user.id}) in guild: ${guild.name}`);
        console.log(userLocalLevel[x].users.global_level)
        console.log(userLocalLevel[x].users.global_exp)

        await supabase
          .from('user_guild')
          .upsert([
            {
              user_id: user.id,
              username: user.username,
              servername: guild.name,
              xp: userLocalLevel[x].users.global_xp || 0,
              level: userLocalLevel[x].users.global_level || 0,
              guild_id: guildId
            }
          ]);
        
        if (user.bot) continue;

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

        x++
      }
    }

    // Register all slash commands
    const commands = [
      xpCommand.data,
      resetCommand.data,
      leaderboardCommand.data,
      ball8Command.data,
      setXpCommand.data,
      shipCommand.data
    ].filter(Boolean);

    for (const guild of client.guilds.cache.values()) {
      await guild.commands.set([]);
      await guild.commands.set(commands); 
    }
  });
}