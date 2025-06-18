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
          .select('users(global_xp, global_level, username)')
          .eq('guild_id', guild.id)


      let x = 0;
      for (const member of guild.members.cache.values()) {
        const { user } = member;

        // Ensure userLocalLevel[x] exists before accessing
        const userLevelData = userLocalLevel && userLocalLevel[x] ? userLocalLevel[x].users : {};

        await supabase
          .from('user_guild')
          .upsert([
            {
              user_id: user.id,
              username: user.username,
              servername: guild.name,
              xp: userLevelData.global_xp || 0,
              level: userLevelData.global_level || 0,
              guild_id: guildId
            }
          ]);

        if (user.bot) {
          x++;
          continue;
        }

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
        x++;
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