import supabase from "../database/supabaseClient.js";

export async function awardBadgeToUser(userId, badgeId, guildId, username, guildname) {
  if (guildId) {
    const { error } = await supabase
      .from("user_badge")
      .upsert([{ id_user: userId, id_badge: badgeId, id_guild: guildId, username: username, guild_name: guildname }], {
        onConflict: ["id_user", "id_badge", "id_guild"],
      });

    if (error) {
      console.error(`Failed to award badge ${badgeId} to user ${userId}:`, error);
    }
    else{
      console.log(`Badge ${badgeId} awarded to user ${userId} in guild ${guildId}`);
    }
  }
}

export async function getUserBadges(userId) {
  const { data, error } = await supabase
    .from("user_badge")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    console.error(`Failed to get badges for user ${userId}:`, error);
    return [];
  }
  return data;
}
