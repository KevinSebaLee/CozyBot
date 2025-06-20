import xpCommand from '../commands/xp.js';
import resetCommand from '../commands/reset.js';
import leaderboardCommand from '../commands/leaderboard.js';
import ball8Command from '../commands/8ball.js';
import setXpCommand from '../commands/setXP.js';
import shipCommand from '../commands/ship.js';

export default function (client) {
  client.on('guildCreate', async (guild) => {
    const commands = [
      xpCommand.data,
      resetCommand.data,
      leaderboardCommand.data,
      ball8Command.data,
      setXpCommand.data,
      shipCommand.data
    ].filter(Boolean);

    try {
      await guild.commands.set(commands);
      console.log(`Registered slash commands for new guild: ${guild.name} (${guild.id})`);
    } catch (err) {
      console.error(`Failed to register commands for new guild ${guild.name} (${guild.id}):`, err);
    }
  });
}