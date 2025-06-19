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

    console.log(`User ${userId} has ${userXP.global_xp} XP, Level ${newLevel}, XP Needed for next level: ${xpNeeded}`);
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

export async function createXPWidget(user, userXP, posicion, options = {}) {
  // Canvas dimensions
  const width = 600;
  const height = 250;

  // Layout constants
  const avatarSize = 100;
  // Move avatar more to the right (was 30)
  const avatarX = 60;
  const avatarY = 60;

  // Overlay (rectangle) at the bottom
  const overlayWidth = 560;
  const overlayHeight = 100;
  const overlayX = 20;
  const overlayY = height - overlayHeight - 20; // 20px margin from bottom
  const overlayRadius = 28;

  // Bar (moved slightly down)
  const barWidth = 320;
  const barHeight = 28;
  const barX = 210;
  const barY = overlayY + 55; // moved down from 38 to 55

  const barRadius = barHeight / 2;

  // Colors & fonts
  const overlayColor = 'rgba(255,255,255,0.7)';
  const barBgColor = '#e5e7eb';
  const barFillColor = '#7b9fff';
  const xpTextColor = '#444';
  const levelTextColor = '#888';
  let rankColor = '#444'; // Default rank color
  // Make rank color more visible (brighter gold)
  if(posicion === 1) {
    rankColor = '#FFD700'; // Gold color for rank
  }
  else if(posicion === 2) {
    rankColor = '#C0C0C0'; // Silver color for rank
  }
  else if(posicion === 3) {
    rankColor = '#CD7F32'; // Bronze color for rank
  }

  const usernameColor = '#444';

  // Emojis and their colors (if enabled)
  const emojiList = [
    { char: '⭐', color: '#FFD700' },
    { char: '🔥', color: '#FF5733' },
    { char: '❄️', color: '#00BFFF' },
    { char: '👑', color: '#F1C40F' },
    { char: '🌙', color: '#8e44ad' },
    { char: '☀️', color: '#f9d923' }
  ];
  const emojis = emojiList.map(e => e.char).join(' ');

  // Option to color emojis
  const colorEmojis = options.colorEmojis === true;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = 'https://media.discordapp.net/attachments/1384218094628507769/1385056050423795813/3daac57c1a68599a1c7b300038fb446e.png?ex=6854ad77&is=68535bf7&hm=ff7700b7faa5d3fd4046b273b01497cb90451ca37722701be8dc870f6dd792aa&='
  // Draw background image (optional, use a default if not provided)
  if (image) {
    try {
      const bg = await loadImage(image);
      // Calculate aspect ratio fit
      const imgRatio = bg.width / bg.height;
      const canvasRatio = width / height;
      let drawWidth, drawHeight, offsetX, offsetY;
      if (imgRatio > canvasRatio) {
        // Image is wider than canvas
        drawHeight = height;
        drawWidth = bg.width * (height / bg.height);
        offsetX = -(drawWidth - width) / 2;
        offsetY = 0;
      } else {
        // Image is taller than canvas
        drawWidth = width;
        drawHeight = bg.height * (width / bg.width);
        offsetX = 0;
        offsetY = -(drawHeight - height) / 2;
      }
      ctx.drawImage(bg, offsetX, offsetY, drawWidth, drawHeight);
    } catch {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw rounded overlay at the bottom (slightly more transparent)
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(overlayX + overlayRadius, overlayY);
  ctx.lineTo(overlayX + overlayWidth - overlayRadius, overlayY);
  ctx.quadraticCurveTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayRadius);
  ctx.lineTo(overlayX + overlayWidth, overlayY + overlayHeight - overlayRadius);
  ctx.quadraticCurveTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX + overlayWidth - overlayRadius, overlayY + overlayHeight);
  ctx.lineTo(overlayX + overlayRadius, overlayY + overlayHeight);
  ctx.quadraticCurveTo(overlayX, overlayY + overlayHeight, overlayX, overlayY + overlayHeight - overlayRadius);
  ctx.lineTo(overlayX, overlayY + overlayRadius);
  ctx.quadraticCurveTo(overlayX, overlayY, overlayX + overlayRadius, overlayY);
  ctx.closePath();
  ctx.fillStyle = overlayColor;
  ctx.fill();
  ctx.restore();

  // Draw avatar (circle) in front of the rectangle
  const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImg = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // Username + emojis (inside overlay, smaller font)
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = usernameColor;
  ctx.textAlign = 'left';
  let username = user.username;
  const maxUsernameWidth = overlayWidth - avatarSize - 60; // fit inside overlay
  let usernameWidth = ctx.measureText(username).width;
  while (usernameWidth > maxUsernameWidth) {
    username = username.slice(0, -1);
    usernameWidth = ctx.measureText(username + '…').width;
  }
  if (username !== user.username) username += '…';

  // Move username and emojis slightly more to the right
  const usernameY = overlayY + 25;
  // Move username to match avatar shift (was overlayX + avatarSize + 60)
  const usernameX = overlayX + avatarSize + 90;
  ctx.fillText(username, usernameX, usernameY);

  // Draw emojis/badges next to username, also inside overlay, smaller font
  ctx.font = '16px Arial';
  const badgePadding = 40;
  let emojiDrawX = usernameX + ctx.measureText(username).width + badgePadding;
  if (emojiDrawX + ctx.measureText(emojis).width < overlayX + overlayWidth - 20) {
    if (colorEmojis) {
      // Draw each emoji with its color
      let x = emojiDrawX;
      for (const emoji of emojiList) {
        ctx.save();
        ctx.fillStyle = emoji.color;
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(emoji.char, x, usernameY);
        x += ctx.measureText(emoji.char + ' ').width;
        ctx.restore();
      }
    } else {
      // Draw all emojis in default color
      ctx.fillStyle = usernameColor;
      ctx.fillText(emojis, emojiDrawX, usernameY);
    }
  }

  // Grado (Rank) inside overlay - smaller font, keep "1" in same line
  // Make "1" more visible: bigger, bold, gold, with strong shadow and outline
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  const gradoText = 'Grado : ';
  const gradoX = overlayX + 20;
  const gradoY = overlayY + 65;

  // Draw "Grado : " with shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#444';
  ctx.fillText(gradoText, gradoX, gradoY);
  ctx.restore();

  // Draw the rank number "1" in gold, bigger, bold, with strong shadow and white outline
  ctx.save();
  ctx.font = 'bold 32px Arial';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = rankColor;
  const gradoTextWidth = ctx.measureText(gradoText).width;
  const rankValue = `${posicion || 1}`;
  // Draw outline
  ctx.strokeText(rankValue, gradoX + gradoTextWidth + 2, gradoY + 2);
  // Draw fill
  ctx.fillText(rankValue, gradoX + gradoTextWidth + 2, gradoY + 2);
  ctx.restore();

  // XP Bar background (inside overlay, moved slightly down)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(barX + barRadius, barY);
  ctx.lineTo(barX + barWidth - barRadius, barY);
  ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + barRadius);
  ctx.lineTo(barX + barWidth, barY + barHeight - barRadius);
  ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - barRadius, barY + barHeight);
  ctx.lineTo(barX + barRadius, barY + barHeight);
  ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - barRadius);
  ctx.lineTo(barX, barY + barRadius);
  ctx.quadraticCurveTo(barX, barY, barX + barRadius, barY);
  ctx.closePath();
  ctx.fillStyle = barBgColor;
  ctx.fill();
  ctx.restore();

  // XP Bar fill (fixed: use clip for rounded bar fill)
  const xpNeeded = Math.round(BASE_EXP * ((Math.pow(GROWTH_RATE, userXP.global_level) - 1) / (GROWTH_RATE - 1)));
  const percent = Math.min(userXP.global_xp / xpNeeded, 1);

  if (percent > 0) {
    ctx.save();
    // Draw the rounded bar path and clip to it
    ctx.beginPath();
    ctx.moveTo(barX + barRadius, barY);
    ctx.lineTo(barX + barWidth - barRadius, barY);
    ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + barRadius);
    ctx.lineTo(barX + barWidth, barY + barHeight - barRadius);
    ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - barRadius, barY + barHeight);
    ctx.lineTo(barX + barRadius, barY + barHeight);
    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - barRadius);
    ctx.lineTo(barX, barY + barRadius);
    ctx.quadraticCurveTo(barX, barY, barX + barRadius, barY);
    ctx.closePath();
    ctx.clip();

    // Draw the filled part as a rectangle (it will be clipped to the rounded bar)
    ctx.fillStyle = barFillColor;
    ctx.fillRect(barX, barY, barWidth * percent, barHeight);
    ctx.restore();
  }

  // XP Bar border
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(barX + barRadius, barY);
  ctx.lineTo(barX + barWidth - barRadius, barY);
  ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + barRadius);
  ctx.lineTo(barX + barWidth, barY + barHeight - barRadius);
  ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - barRadius, barY + barHeight);
  ctx.lineTo(barX + barRadius, barY + barHeight);
  ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - barRadius);
  ctx.lineTo(barX, barY + barRadius);
  ctx.quadraticCurveTo(barX, barY, barX + barRadius, barY);
  ctx.closePath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();

  // Nivel above XP bar (centered above bar, moved slightly down)
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = levelTextColor;
  ctx.textAlign = 'center';
  const nivelText = `Nivel : ${userXP.global_level}`;
  ctx.fillText(nivelText, barX + barWidth / 2, barY - 2); // moved down from -12 to -2

  // XP Text
  let xpText = `${userXP.global_xp} / ${xpNeeded} XP`;
  let xpFontSize = 14;
  ctx.font = `bold ${xpFontSize}px Arial`;
  let xpTextWidth = ctx.measureText(xpText).width;
  const maxXPTextWidth = barWidth - 20;
  while (xpTextWidth > maxXPTextWidth && xpFontSize > 10) {
    xpFontSize -= 1;
    ctx.font = `bold ${xpFontSize}px Arial`;
    xpTextWidth = ctx.measureText(xpText).width;
  }
  ctx.fillStyle = xpTextColor;
  ctx.textAlign = 'center';
  ctx.fillText(
    xpText,
    barX + barWidth / 2,
    barY + barHeight - 7
  );

  // Return as Discord attachment
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'xp-widget.png' });
}