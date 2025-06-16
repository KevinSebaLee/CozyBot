import supabase from '../database/supabaseClient.js';
import { createXPWidget } from '../utils/xpUtils.js';

// Only use this for slash command interactions!
const xpCommand = async (interaction) => {
  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('xpCommand called with non-Interaction:', interaction);
    return;
  }

  const userId = interaction.user.id;
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

  try {
    const attachment = await createXPWidget(interaction.user, userXP);
    await interaction.reply({ files: [attachment] });
  } catch (err) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Could not generate XP widget image.', flags: 64 });
    } else if (typeof interaction.editReply === 'function') {
      await interaction.editReply({ content: 'Could not generate XP widget image.' });
    } else {
      console.error('Interaction does not support editReply:', interaction);
    }
  }
};

export default xpCommand;