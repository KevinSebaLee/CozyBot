import { SlashCommandBuilder } from 'discord.js';
import supabase from '../database/supabaseClient.js';
import { createXPWidget } from '../utils/xpUtils.js';

// Define the slash command data
const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Mostrar tu XP y nivel')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('El usuario del que quieres ver el XP')
      .setRequired(false)
  );

// Only use this for slash command interactions!
const xpCommand = async (interaction) => {
  const user = interaction.options.getUser('user') || interaction.user;
  const userId = user.id;

  console.log(`xpCommand called by user: ${user.tag} (${userId})`);

  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('xpCommand called with non-Interaction:', interaction);
    return;
  }

  const { data: userXP, error } = await supabase
    .from('users')
    .select('global_xp, global_level')
    .eq('id', userId)
    .single();

  if (error) {
    await interaction.reply({ content: 'An error occurred while fetching your XP.', flags: 64 });
    return;
  }

  if (!userXP) {
    await interaction.reply({ content: 'You have no XP yet. Start chatting to earn some!', flags: 64 });
    return;
  }

  const { data: posicion, error: err } = await supabase
    .from('users')
    .select('global_level, global_xp')
    .order('global_level', { ascending: false })
    .order('global_xp', { ascending: false });
    
  const posiscionEncontrada = posicion.findIndex(u => u.global_level === userXP.global_level && u.global_xp === userXP.global_xp) + 1;

  try {
    const attachment = await createXPWidget(user, userXP, posiscionEncontrada);
    await interaction.reply({ files: [attachment] });
  } catch (err) {
    if (!interaction.replied && !interaction.deferred) {
      console.log(err)
      await interaction.reply({ content: 'Could not generate XP widget image.', flags: 64 });
    } else if (typeof interaction.editReply === 'function') {
      await interaction.editReply({ content: 'Could not generate XP widget image.' });
    } else {
      console.error('Interaction does not support editReply:', interaction);
    }
  }
};

xpCommand.data = data;

export default xpCommand;