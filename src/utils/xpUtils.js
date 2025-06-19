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

  // Badge images (replace emojis with images)
  const badgeList = [
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385070387540262912/image.png?ex=6854bad1&is=68536951&hm=52e35673e2e6a00b18b99789d37a6a30e93ef4ae1056dc53fe9b9074e475b79c&=' },
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066908440592476/c83de10755b77e26b349d625be30a086-removebg-preview.png?ex=6854b794&is=68536614&hm=deb8e88cf79733cdc70f7e654170a301a68e06bd7af28e451e45a77c5e4b7eb3&=' },
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066909074063360/008f737701344813b4ba847a676dd6a6-removebg-preview.png?ex=6854b794&is=68536614&hm=58edddd714e08b686123efa06632fc9cffef726073d1826e02688239d9834d8d&=' },
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066908755169331/09e5774de3330575155c11989eb6b6e3-removebg-preview.png?ex=6854b794&is=68536614&hm=50ac6c2ce635f01024a92f4bbbf7eae2f9321915d2853c0087d9e61ab723b862&=' },
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385068940253724682/C9UgDin5uSwBAAAAABJRU5ErkJggg.png?ex=6854b978&is=685367f8&hm=f57437fefd3a84242708a3d0393638ed74136d763e89de691fa892721cc8c832&=' },
    { url: ''},
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385073086717493341/Votre_texte_de_paragraphe-removebg-preview.png?ex=6854bd55&is=68536bd5&hm=24821509f9ce673d048368c19686ff143e16095a6925e35c9e3251660778d26d&=' },
    { url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066908147126395/telechargement_1.png?ex=6854b794&is=68536614&hm=834b95616e50b3b7f934df5010ef66a07f2e3d2bd4a161948f9a4ab1d525c718&=' },
    { url: ''},
  ];

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
        drawHeight = height;
        drawWidth = bg.width * (height / bg.height);
        offsetX = -(drawWidth - width) / 2;
        offsetY = 0;
      } else {
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

  // Username (inside overlay, smaller font)
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = usernameColor;
  ctx.textAlign = 'left';
  let username = user.username;
  const maxUsernameWidth = overlayWidth - avatarSize - 60;
  let usernameWidth = ctx.measureText(username).width;
  while (usernameWidth > maxUsernameWidth) {
    username = username.slice(0, -1);
    usernameWidth = ctx.measureText(username + '…').width;
  }
  if (username !== user.username) username += '…';

  const usernameY = overlayY + 25;
  const usernameX = overlayX + avatarSize + 90;
  ctx.fillText(username, usernameX, usernameY);

  // Draw badge images next to username
  let badgeDrawX = usernameX + ctx.measureText(username).width + 40;
  const badgeY = usernameY - 18; // vertically align with username
  const badgeSize = 24;
  for (const badge of badgeList) {
    if (badge.url) {
      try {
        const badgeImg = await loadImage(badge.url);
        ctx.drawImage(badgeImg, badgeDrawX, badgeY, badgeSize, badgeSize);
        badgeDrawX += badgeSize + 8;
      } catch {
        // If image fails to load, skip
        badgeDrawX += badgeSize + 8;
      }
    }
  }

  // Grado (Rank) inside overlay - smaller font, keep "1" in same line
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  const gradoText = 'Grado : ';
  const gradoX = overlayX + 20;
  const gradoY = overlayY + 65;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#444';
  ctx.fillText(gradoText, gradoX, gradoY);
  ctx.restore();

  ctx.save();
  ctx.font = 'bold 32px Arial';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = rankColor;
  const gradoTextWidth = ctx.measureText(gradoText).width;
  const rankValue = `${posicion || 1}`;
  ctx.strokeText(rankValue, gradoX + gradoTextWidth + 2, gradoY + 2);
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
  ctx.fillText(nivelText, barX + barWidth / 2, barY - 2);

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
