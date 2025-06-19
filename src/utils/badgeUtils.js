import supabase from "../database/supabaseClient.js";

export async function awardBadgeToUser(userId, badgeId) {
  const { error } = await supabase
    .from("user_badge")
    .upsert([{ id_user: userId, id_badge: badgeId }], {
      onConflict: ["id_user", "id_badge"],
    });

  if (error) {
    console.error(`Failed to award badge ${badgeId} to user ${userId}:`, error);
  } else {
    console.log(`Awarded badge ${badgeId} to user ${userId}`);
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
