import xpCommand from '../commands/xp.js';
import resetCommand from '../commands/reset.js';
import leaderboardCommand from '../commands/leaderboard.js';
import ball8Command from '../commands/8ball.js';
import setXpCommand from '../commands/setXP.js';
import shipCommand from '../commands/ship.js';

export default function (client) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'rank') {
      await xpCommand(interaction);
    }

    if (interaction.commandName === 'resetlevel') {
      await resetCommand(interaction);
    }

    if (interaction.commandName === 'leaderboard') {
      await leaderboardCommand(interaction);
    }

    if(interaction.commandName === '8ball'){
      await ball8Command(interaction);
    }

    if(interaction.commandName === 'setxp'){
      await setXpCommand(interaction);
    }

    if(interaction.commandName === 'ship'){
      await shipCommand(interaction);
    }
  });
}