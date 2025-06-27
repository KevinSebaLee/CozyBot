import supabase from "../database/supabaseClient.js";
import { createXPWidget } from "../utils/xp/xpImage.js";

export async function getUserXPData(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('global_xp, global_level')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function getUserRankPosition(level, xp) {
  const { data: users } = await supabase
    .from('users')
    .select('global_level, global_xp')
    .order('global_level', { ascending: false })
    .order('global_xp', { ascending: false });
  return users.findIndex(u => u.global_level === level && u.global_xp === xp) + 1;
}

export async function getUserGuild(guildId) {
  const { data, error } = await supabase
    .from('guilds')
    .select('id')
    .eq('id', guildId)
    .single();
  return data;
}

export async function generateXPWidget(user, userXP, position, guildId) {
  return createXPWidget(user, userXP, position, guildId);
}

export async function setUserXPLevel(userId, xp, level) {
  const { error } = await supabase
    .from("users")
    .update({
      global_xp: xp,
      global_level: level,
    })
    .eq("id", userId);
  return !error;
}