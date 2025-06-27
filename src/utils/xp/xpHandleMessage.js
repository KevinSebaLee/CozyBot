import supabase from '../../database/supabaseClient.js';
import { getMultiplier, checkCooldown, maybeTriggerGlobalMultiplier, maybeTriggerQuickXPEvent } from './xpEvent.js';

export async function handleXPMessage(message) {
  if (message.author.bot || !checkCooldown(message.author.id)) return;

  await maybeTriggerGlobalMultiplier(message);
  await maybeTriggerQuickXPEvent(message);

  // Normal XP gain
  const baseXP = 50;
  const xpToAdd = Math.floor(baseXP * getMultiplier());

  // Update XP in DB
  const { data: userXP } = await supabase
    .from('users')
    .select('global_xp, global_level')
    .eq('id', message.author.id)
    .single();

  if (!userXP) {
    await supabase
      .from('users')
      .insert({ id: message.author.id, global_xp: xpToAdd, global_level: 1 });
  } else {
    await supabase
      .from('users')
      .update({ global_xp: userXP.global_xp + xpToAdd })
      .eq('id', message.author.id);
    // Add level up logic here if desired
  }
}