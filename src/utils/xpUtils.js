import supabase from '../database/supabaseClient.js';
import { awardBadgeToUser } from './badgeUtils.js';
import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage, Image } from 'canvas';
import axios from 'axios';

export const BASE_EXP = 50;
export const GROWTH_RATE = 1.025;

async function loadImageFromURL(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const img = new Image();
  img.src = Buffer.from(response.data, 'binary');
  return img;
}

export async function handleXPMessage(message) {
  if (!global.xpCooldowns) global.xpCooldowns = new Map();

  const userId = message.author.id;
  const now = Date.now();
  const lastXP = global.xpCooldowns.get(userId) || 0;

  const { data: leaderboard, error: leaderboardError } = await supabase
    .from('user_guild')
    .select('users(id, global_xp, global_level, username)')
    .eq('guild_id', message.guild.id)
    .order('users(global_level)', { ascending: false })
    .order('users(global_xp)', { ascending: false });

  if (leaderboardError) {
    console.error('Error fetching leaderboard:', leaderboardError);
    return;
  }

  if (leaderboard.length > 0 && leaderboard[0].users.id === userId) { // Modified user_id to id
    await awardBadgeToUser(userId, 1, message.guild.id, leaderboard[0].users.username, message.guild.name);
  }

  if (message.reference && message.reference.messageId) {
    try {
      const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMsg.author.id === '607672865218756621' && repliedMsg.author.id != userId) {
        const userEntry = leaderboard.find(entry => entry.users.id === userId);
        const username = userEntry ? userEntry.users.username : message.author.username;
        await awardBadgeToUser(userId, 3, message.guild.id, username, message.guild.name);
      }
    } catch (err) {
      // Could not fetch the replied message (maybe deleted or inaccessible)
    }
  }

  for (let i = 0; i < leaderboard.length; i++) {
    if (leaderboard[i].users.id === userId && i < 10) {
      await awardBadgeToUser(userId, 2, message.guild.id, leaderboard[i].users.username, message.guild.name);
    }
  }

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
      else {
        console.warn(`Update channel not found for user ${userId}`);
      }
    }
    await supabase.from('users').update({ global_xp: newXP, global_level: newLevel }).eq('id', userId);
  } else {
    newXP = xpToAdd;
    await supabase.from('users').insert([{ id: userId, global_xp: newXP, global_level: newLevel }]);
  }
}

export async function createXPWidget(user, userXP, posicion, id_guild, deviceWidth = 600, deviceHeight = 250) {
  // Responsive: adjust for mobile (narrow) screens
  let width = deviceWidth;
  let height = deviceHeight;
  let isMobile = width < 400;

  // Adjust layout for mobile
  if (isMobile) {
    width = Math.max(width, 320);
    height = Math.max(height, 420); // Taller for stacking
  }

  // Proportional layout constants
  const avatarSize = isMobile ? Math.round(width * 0.22) : Math.round(width * 0.17);
  const avatarX = isMobile ? Math.round(width * 0.39) : Math.round(width * 0.10);
  const avatarY = isMobile ? Math.round(height * 0.07) : Math.round(height * 0.24);

  const overlayWidth = Math.round(width * 0.93);
  const overlayHeight = isMobile ? Math.round(height * 0.38) : Math.round(height * 0.40);
  const overlayX = Math.round(width * 0.033);
  const overlayY = isMobile
    ? height - overlayHeight - Math.round(height * 0.04)
    : height - overlayHeight - Math.round(height * 0.08);
  const overlayRadius = Math.round(overlayHeight * 0.28);

  const barWidth = isMobile ? Math.round(width * 0.80) : Math.round(width * 0.53);
  const barHeight = Math.round(overlayHeight * 0.28);
  const barX = isMobile ? Math.round(width * 0.10) : Math.round(width * 0.35);
  const barY = overlayY + Math.round(overlayHeight * (isMobile ? 0.43 : 0.55));
  const barRadius = Math.round(barHeight / 2);

  // Colors & fonts
  const overlayColor = 'rgba(255,255,255,0.7)';
  const barBgColor = '#e5e7eb';
  const barFillColor = '#7b9fff';
  const xpTextColor = '#444';
  const levelTextColor = '#888';
  let rankColor = '#444';
  if (posicion === 1) rankColor = '#FFD700';
  else if (posicion === 2) rankColor = '#C0C0C0';
  else if (posicion === 3) rankColor = '#CD7F32';
  const usernameColor = '#444';

  // Badge images

  const badgeList = [
    { id: 1, url: 'https://media.discordapp.net/attachments/1383898321046737010/1385686331811823666/f3ecfb45cf3578f3e85db3f78b7a63fc-removebg-preview.png?ex=6856f876&is=6855a6f6&hm=4d4c1d0eb56214e4e6793840f59aaa6fafd0eaad75eb0f06ca4dce9ac2397dae&=' },
    { id: 2, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686332147372063/telechargement_1.png?ex=6856f876&is=6855a6f6&hm=5569ba362a72358f239c950a5d4ab9a6fbba9276e10272b8447b90ec18768bb5&' },
    { id: 3, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686332474392586/008f737701344813b4ba847a676dd6a6-removebg-preview.png?ex=6856f876&is=6855a6f6&hm=0a538134ac70014b80c1cc9d2a0725b24d6de4102d9df072518c5d3e29c0aad5&' },
    { id: 4, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686332784902174/09e5774de3330575155c11989eb6b6e3-removebg-preview.png?ex=6856f876&is=6855a6f6&hm=9a469ffa3d0bc5ba7d7afdf29fe241239280879aa714a81f0cbf1139e048dc3f&' },
    { id: 5, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686333103542302/c83de10755b77e26b349d625be30a086-removebg-preview.png?ex=6856f876&is=6855a6f6&hm=b68205086022123f37de8769f4b740cb8cd02a130e8924667e489d1d908af26f&' },
    { id: 6, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686333434888403/C9UgDin5uSwBAAAAABJRU5ErkJggg.png?ex=6856f876&is=6855a6f6&hm=12a7b802907764aaf45856de473def8f9191f1572a69d01d027fa10045706614&' },
    { id: 7, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686333737009152/image.png?ex=6856f876&is=6855a6f6&hm=43f18ee5d707fbe3aa824cdc6f5bd466f511be6d9155d6e464f32a158ee5fb95&' },
    { id: 8, url: 'https://cdn.discordapp.com/attachments/1383898321046737010/1385686334118694952/Votre_texte_de_paragraphe-removebg-preview.png?ex=6856f876&is=6855a6f6&hm=0e04b5f15c7d7369bb2110ea5b611d20d2e0ad54fd489ef748a83c8ad718254a&' }
  ];

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = 'https://media.discordapp.net/attachments/1384218094628507769/1385052269803737118/3daac57c1a68599a1c7b300038fb446e.png?ex=6855fb72&is=6854a9f2&hm=01e04c24e95b343fea3c53f89ca71a3f98e0ebf3635d2404ec1ec74fd008484b&=';

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

  // Draw rounded overlay at the bottom
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

  // Draw avatar (circle)
  const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImg = await loadImage(avatarURL);

  // Draw avatar with circular clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // Draw thin black circle border around avatar to separate from the card
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 1, 0, Math.PI * 2, true);
  ctx.lineWidth = 2; // Thin border
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.restore();

  // Username (inside overlay, proportional font)
  const usernameFontSize = isMobile ? Math.round(width * 0.07) : Math.round(width * 0.033);
  ctx.font = `bold ${usernameFontSize}px Arial`;
  ctx.fillStyle = usernameColor;
  ctx.textAlign = 'left';
  let username = user.username;
  const maxUsernameWidth = overlayWidth - avatarSize - Math.round(width * 0.10);
  let usernameWidth = ctx.measureText(username).width;
  while (usernameWidth > maxUsernameWidth) {
    username = username.slice(0, -1);
    usernameWidth = ctx.measureText(username + '…').width;
  }
  if (username !== user.username) username += '…';

  const usernameY = isMobile
    ? avatarY + avatarSize + Math.round(width * 0.09)
    : overlayY + Math.round(overlayHeight * 0.25);
  const usernameX = isMobile
    ? Math.round(width * 0.10)
    : overlayX + avatarSize + Math.round(width * 0.15);
  ctx.fillText(username, usernameX, usernameY);

  // Draw badge images next to username (wrap on mobile)
  let badgeDrawX = usernameX + ctx.measureText(username).width + Math.round(width * 0.04);
  let badgeDrawY = usernameY - Math.round(usernameFontSize * 0.9);
  const badgeSize = isMobile ? Math.round(width * 0.08) : Math.round(width * 0.04);
  const badgeSpacing = Math.round(width * 0.013);
  const badgeWrapLimit = isMobile ? 3 : 99; // wrap after 3 badges on mobile

  const { data: userBadges } = await supabase
    .from('user_badge')
    .select('id_badge, id_guild')
    .eq('id_user', user.id)
    .eq('id_guild', id_guild);

  let badgeCount = 0;
  for (const badge of badgeList) {
    if (userBadges && userBadges.length > 0) {
      for (let x = 0; x < userBadges.length; x++) {
        if (userBadges[x].id_badge && badge.url && userBadges[x].id_badge === badge.id) {
          if (badge.url && typeof badge.url === 'string' && badge.url.trim() !== '') {
            try {
              const badgeImg = await loadImageFromURL(badge.url); // <- Use custom loader
              ctx.drawImage(badgeImg, badgeDrawX, badgeDrawY, badgeSize, badgeSize);
            } catch (err) {
              console.error('Failed to load badge image:', badge.url, err);
              ctx.save();
              ctx.fillStyle = '#bbb';
              ctx.fillRect(badgeDrawX, badgeDrawY, badgeSize, badgeSize);
              ctx.restore();
            }
            badgeDrawX += badgeSize + badgeSpacing;
            badgeCount++;
            if (isMobile && badgeCount % badgeWrapLimit === 0) {
              badgeDrawX = usernameX;
              badgeDrawY += badgeSize + Math.round(width * 0.01);
            }
          }
        }
      }
    }
  }

  // Grado (Rank) inside overlay
  const gradoFontSize = isMobile ? Math.round(width * 0.09) : Math.round(width * 0.037);
  ctx.font = `bold ${gradoFontSize}px Arial`;
  ctx.textAlign = 'left';
  const gradoText = 'Grado : ';
  const gradoX = overlayX + Math.round(width * 0.023);
  const gradoY = overlayY + Math.round(overlayHeight * (isMobile ? 0.30 : 0.65));

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.round(width * 0.01);
  ctx.fillStyle = '#444';
  ctx.fillText(gradoText, gradoX, gradoY);
  ctx.restore();

  ctx.save();
  ctx.font = `bold ${isMobile ? Math.round(width * 0.13) : Math.round(width * 0.053)}px Arial`;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = Math.round(width * 0.016);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = rankColor;

  const gradoTextWidth = ctx.measureText(gradoText).width;
  const rankValue = `${posicion || 1}`;
  ctx.strokeText(rankValue, gradoX + gradoTextWidth + 2, gradoY + 2);
  ctx.fillText(rankValue, gradoX + gradoTextWidth + 2, gradoY + 2);
  ctx.restore();

  // Make XP Bar larger and move it slightly down
  const barExtraWidth = Math.round(width * 0.06); // Increase width by 6% of canvas width
  const barNewWidth = barWidth + barExtraWidth;
  const barNewX = barX - Math.round(barExtraWidth / 2);
  const barNewY = barY + Math.round(height * 0.025); // Move down by 2.5% of canvas height

  // XP Bar background
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(barNewX + barRadius, barNewY);
  ctx.lineTo(barNewX + barNewWidth - barRadius, barNewY);
  ctx.quadraticCurveTo(barNewX + barNewWidth, barNewY, barNewX + barNewWidth, barNewY + barRadius);
  ctx.lineTo(barNewX + barNewWidth, barNewY + barHeight - barRadius);
  ctx.quadraticCurveTo(barNewX + barNewWidth, barNewY + barHeight, barNewX + barNewWidth - barRadius, barNewY + barHeight);
  ctx.lineTo(barNewX + barRadius, barNewY + barHeight);
  ctx.quadraticCurveTo(barNewX, barNewY + barHeight, barNewX, barNewY + barHeight - barRadius);
  ctx.lineTo(barNewX, barNewY + barRadius);
  ctx.quadraticCurveTo(barNewX, barNewY, barNewX + barRadius, barNewY);
  ctx.closePath();
  ctx.fillStyle = barBgColor;
  ctx.fill();
  ctx.restore();

  // XP Bar fill
  const xpNeeded = Math.round(BASE_EXP * ((Math.pow(GROWTH_RATE, userXP.global_level) - 1) / (GROWTH_RATE - 1)));
  const percent = Math.min(userXP.global_xp / xpNeeded, 1);

  if (percent > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(barNewX + barRadius, barNewY);
    ctx.lineTo(barNewX + barNewWidth - barRadius, barNewY);
    ctx.quadraticCurveTo(barNewX + barNewWidth, barNewY, barNewX + barNewWidth, barNewY + barRadius);
    ctx.lineTo(barNewX + barNewWidth, barNewY + barHeight - barRadius);
    ctx.quadraticCurveTo(barNewX + barNewWidth, barNewY + barHeight, barNewX + barNewWidth - barRadius, barNewY + barHeight);
    ctx.lineTo(barNewX + barRadius, barNewY + barHeight);
    ctx.quadraticCurveTo(barNewX, barNewY + barHeight, barNewX, barNewY + barHeight - barRadius);
    ctx.lineTo(barNewX, barNewY + barRadius);
    ctx.quadraticCurveTo(barNewX, barNewY, barNewX + barRadius, barNewY);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = barFillColor;
    ctx.fillRect(barNewX, barNewY, barNewWidth * percent, barHeight);
    ctx.restore();
  }

  // XP Bar border
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(barNewX + barRadius, barNewY);
  ctx.lineTo(barNewX + barNewWidth - barRadius, barNewY);
  ctx.quadraticCurveTo(barNewX + barNewWidth, barNewY, barNewX + barNewWidth, barNewY + barRadius);
  ctx.lineTo(barNewX + barNewWidth, barNewY + barHeight - barRadius);
  ctx.quadraticCurveTo(barNewX + barNewWidth, barNewY + barHeight, barNewX + barNewWidth - barRadius, barNewY + barHeight);
  ctx.lineTo(barNewX + barRadius, barNewY + barHeight);
  ctx.quadraticCurveTo(barNewX, barNewY + barHeight, barNewX, barNewY + barHeight - barRadius);
  ctx.lineTo(barNewX, barNewY + barRadius);
  ctx.quadraticCurveTo(barNewX, barNewY, barNewX + barRadius, barNewY);
  ctx.closePath();
  ctx.lineWidth = Math.max(2, Math.round(width * 0.005));
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();

  // Nivel above XP bar
  ctx.font = `bold ${isMobile ? Math.round(width * 0.045) : Math.round(width * 0.027)}px Arial`;
  ctx.fillStyle = levelTextColor;
  ctx.textAlign = 'center';
  const nivelText = `Nivel : ${userXP.global_level}`;
  ctx.fillText(nivelText, barX + barWidth / 2, barY - Math.round(barHeight * 0.07));

  // XP Text (centered vertically and horizontally in the XP bar)
  let xpText = `${userXP.global_xp} / ${xpNeeded} XP`;
  let xpFontSize = isMobile ? Math.round(width * 0.04) : Math.round(width * 0.023);
  ctx.font = `bold ${xpFontSize}px Arial`;
  let xpTextWidth = ctx.measureText(xpText).width;
  const maxXPTextWidth = barWidth - Math.round(width * 0.033);
  while (xpTextWidth > maxXPTextWidth && xpFontSize > 10) {
    xpFontSize -= 1;
    ctx.font = `bold ${xpFontSize}px Arial`;
    xpTextWidth = ctx.measureText(xpText).width;
  }
  ctx.fillStyle = xpTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    xpText,
    barNewX + barNewWidth / 2,
    barNewY + barHeight / 2
  );

  // Return as Discord attachment
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'xp-widget.png' });
}