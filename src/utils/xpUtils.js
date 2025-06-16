import supabase from '../database/supabaseClient.js';
import { AttachmentBuilder } from 'discord.js';

export const BASE_EXP = 50;
export const GROWTH_RATE = 1.2;

export async function handleXPMessage(message) {
  if (!global.xpCooldowns) global.xpCooldowns = new Map();

  const userId = message.author.id;
  const now = Date.now();
  const lastXP = global.xpCooldowns.get(userId) || 0;

  if (now - lastXP < 60000) return;
  global.xpCooldowns.set(userId, now);

  const xpToAdd = Math.floor(Math.random() * 10) + 5;
  const { data: userXP, error } = await supabase
    .from('users')
    .select('global_xp, global_level')
    .eq('id', userId)
    .single();

  let newXP = xpToAdd, newLevel = 1;
  if (!error && userXP) {
    newXP = userXP.global_xp + xpToAdd;
    newLevel = userXP.global_level;
    const xpNeeded = BASE_EXP * ((Math.pow(GROWTH_RATE, newLevel) - 1) / (GROWTH_RATE - 1));
    if (newXP >= xpNeeded) {
      newLevel += 1;
      message.reply(`Congrats ${message.author}, you leveled up to level ${newLevel}!`);
    }
    await supabase.from('users').update({ global_xp: newXP, global_level: newLevel }).eq('id', userId);
  } else {
    await supabase.from('users').insert([{ id: userId, global_xp: newXP, global_level: newLevel }]);
  }
}

export async function createXPWidget(user, userXP) {
  const { createCanvas, loadImage } = await import('canvas');
  const canvasWidth = 500, canvasHeight = 150, avatarSize = 120, padding = 15;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#23272A';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Avatar
  const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImg = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(padding + avatarSize / 2, canvasHeight / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, padding, (canvasHeight - avatarSize) / 2, avatarSize, avatarSize);
  ctx.restore();

  // Username/Level
  ctx.font = 'bold 28px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(user.username, avatarSize + padding * 2, 50);
  ctx.font = '20px Sans-serif';
  ctx.fillStyle = '#b9bbbe';
  ctx.fillText(`Level: ${userXP.global_level}`, avatarSize + padding * 2, 80);

  // XP Bar
  const barX = avatarSize + padding * 2, barY = 100, barWidth = 340, barHeight = 28;
  const xpNeeded = BASE_EXP * ((Math.pow(GROWTH_RATE, userXP.global_level) - 1) / (GROWTH_RATE - 1));
  const percent = Math.min(userXP.global_xp / xpNeeded, 1);

  ctx.fillStyle = '#40444b';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = '#00b0f4';
  ctx.fillRect(barX, barY, barWidth * percent, barHeight);
  ctx.font = '18px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${userXP.global_xp} / ${Math.floor(xpNeeded)} XP`, barX + barWidth / 2, barY + barHeight - 7);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'xp-widget.png' });
}