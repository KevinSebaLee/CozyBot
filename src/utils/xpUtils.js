import supabase from '../database/supabaseClient.js';
import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';

export const BASE_EXP = 50;
export const GROWTH_RATE = 1.025;

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

  let newXP, newLevel = 1;
  if (!error && userXP) {
    newXP = userXP.global_xp + xpToAdd;
    newLevel = userXP.global_level;
    const xpNeeded = BASE_EXP * ((Math.pow(GROWTH_RATE, newLevel) - 1) / (GROWTH_RATE - 1));

    if (newXP >= xpNeeded) {
      newLevel += 1;
      newXP = 0;

      const updateChannel = message.guild.channels.cache.find(
        ch => ch.name === '🚀・niveles' || ch.name === '🚀・niveles'
      );
      if (updateChannel) {
        updateChannel.send(`Felicitaciones ${message.author}! Subiste al nivel **${newLevel}**! Sigue asi!`);
      }
      else{
        console.warn(`Update channel not found for user ${userId}`);
      }
    }
    await supabase.from('users').update({ global_xp: newXP, global_level: newLevel }).eq('id', userId);
  } else {
    newXP = xpToAdd;
    await supabase.from('users').insert([{ id: userId, global_xp: newXP, global_level: newLevel }]);
  }
}

export async function createXPWidget(user, userXP) {
  const width = 500;
  const height = 220;
  const avatarSize = 100;
  const padding = 30;
  const overlayRadius = 32;
  const barWidth = 270;
  const barHeight = 24;
  const barRadius = barHeight / 2;
  const overlayX = 10;
  const overlayY = 40;
  const overlayW = width - 20;
  const overlayH = 140;

  // Example background image (replace with your own if needed)
  const backgroundUrl = 'https://i.imgur.com/4M34hi2.png'; // fallback bg
  let bgLoaded = false;

  // Create canvas and context
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background image
  try {
    const bg = await loadImage(backgroundUrl);
    ctx.drawImage(bg, 0, 0, width, height);
    bgLoaded = true;
  } catch {
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw semi-transparent rounded rectangle overlay
  ctx.save();
  ctx.globalAlpha = 0.85;
  roundRect(ctx, overlayX, overlayY, overlayW, overlayH, overlayRadius);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();

  // Draw avatar (circle)
  const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImg = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(padding + avatarSize / 2, overlayY + overlayH / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, padding, overlayY + overlayH / 2 - avatarSize / 2, avatarSize, avatarSize);
  ctx.restore();

  // Username and emojis
  const emojis = '⭐ 🔥 ❄️ 👑 🌙 ☀️';
  ctx.font = 'bold 32px Sans-serif';
  ctx.fillStyle = '#444';
  ctx.textAlign = 'left';
  ctx.fillText(
    `${user.username} ${emojis}`,
    padding + avatarSize + 30,
    overlayY + 55
  );

  // Level (Nivel)
  ctx.font = 'bold 22px Sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText(`Nivel : ${userXP.global_level}`, padding + avatarSize + 30, overlayY + 85);

  // Grado (Rank)
  ctx.font = '20px Sans-serif';
  ctx.fillStyle = '#444';
  ctx.fillText('Grado :', padding + 10, overlayY + overlayH - 35);
  ctx.font = 'bold 32px Sans-serif';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('1', padding + 80, overlayY + overlayH - 35);

  // XP Bar background (white border)
  const barX = padding + avatarSize + 30;
  const barY = overlayY + 100;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  roundRect(ctx, barX, barY, barWidth, barHeight, barRadius);
  ctx.stroke();
  ctx.fillStyle = '#e5e7eb';
  roundRect(ctx, barX, barY, barWidth, barHeight, barRadius);
  ctx.fill();

  // XP Bar fill
  const BASE_EXP = 50;
  const GROWTH_RATE = 1.2;
  const xpNeeded = BASE_EXP * ((Math.pow(GROWTH_RATE, userXP.global_level) - 1) / (GROWTH_RATE - 1));
  const percent = Math.min(userXP.global_xp / xpNeeded, 1);
  ctx.fillStyle = '#6b8cff';
  roundRect(ctx, barX, barY, barWidth * percent, barHeight, barRadius);
  ctx.fill();
  ctx.restore();

  // XP Text (centered in bar)
  ctx.font = 'bold 18px Sans-serif';
  ctx.fillStyle = '#444';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${userXP.global_xp} / ${Math.round(xpNeeded)} XP`,
    barX + barWidth / 2,
    barY + barHeight - 6
  );

  ctx.textAlign = 'left';

  // Return as Discord attachment
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'xp-widget.png' });
}

// Helper for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}