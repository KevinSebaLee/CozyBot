import xpCommand from '../commands/xp.js';
import resetCommand from '../commands/reset.js'; // Assuming you have a reset command

export default function (client) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'xp') {
      await xpCommand(interaction);  // Only slash commands
    }

    if(interaction.commandName === 'reset') {
      await resetCommand(interaction); // Handle reset command
    } 
  });
}