import supabase from '../database/supabaseClient.js';
import { awardBadgeToUser } from './badgeUtils.js';
import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';

export const BASE_EXP = 50;
export const GROWTH_RATE = 1.025;

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

  for( let i = 0; i < leaderboard.length; i++) {
    if(leaderboard[i].users.id === userId && i < 10) {
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

export async function createXPWidget(user, userXP, posicion, deviceWidth = 600, deviceHeight = 250) {
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
    { id: 1, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066907861909545/f3ecfb45cf3578f3e85db3f78b7a63fc-removebg-preview.png?ex=68556054&is=68540ed4&hm=c8c0cdf525c445719b083391c17d6afdbc68dc32354a302731250c596bfca48f&=&width=625&height=625' },
    { id: 2, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066908440592476/c83de10755b77e26b349d625be30a086-removebg-preview.png?ex=68556054&is=68540ed4&hm=7832c7d40bd1b4e2f8d2f43ca30bcda061779a29839e6fba4058408391827325&=&width=625&height=625' },
    { id: 3, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066909074063360/008f737701344813b4ba847a676dd6a6-removebg-preview.png?ex=68556054&is=68540ed4&hm=dee0768f040ebf38f3dd87ded30255ee7d6d42385f3d5fae3b38bd6f97e09856&=&width=633&height=616' },
    { id: 4, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066908755169331/09e5774de3330575155c11989eb6b6e3-removebg-preview.png?ex=68556054&is=68540ed4&hm=f5dafe7d32e22b7831768d1122fb9a4520a75d91f6bec3986f36c2a59b4a42b1&=&width=450&height=450' },
    { id: 5, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385073086717493341/Votre_texte_de_paragraphe-removebg-preview.png?ex=68556615&is=68541495&hm=5475a09281783c37586dc52d917f4180b2c98d631215084862fb734ed480cab2&=&width=548&height=646' },
    { id: 6, url: '' },
    { id: 7, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385066908147126395/telechargement_1.png?ex=68556054&is=68540ed4&hm=37e16402f70da5c19e60d8fed2f3d6cee21cd6d636dd7d87a93dba9f3602811b&=&width=689&height=689' },
    { id: 8, url: 'https://media.discordapp.net/attachments/1343637880832262144/1385068940253724682/C9UgDin5uSwBAAAAABJRU5ErkJggg.png?ex=68556238&is=685410b8&hm=3e059d6a13ec40843b190643e5d268eb3e0735951b0dd14dbc0681d8cbb47896&=&width=815&height=815' },
    { id: 9, url: '' },
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
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
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
    .select('id_badge')
    .eq('id_user', user.id);

  let badgeCount = 0;
  for (const badge of badgeList) {
    if (userBadges && userBadges.length > 0) {
      for (let x = 0; x < userBadges.length; x++) {
        if (userBadges[x].id_badge && badge.url && userBadges[x].id_badge === badge.id) {
          try {
            const badgeImg = await loadImage(badge.url);
            ctx.drawImage(badgeImg, badgeDrawX, badgeDrawY, badgeSize, badgeSize);
            badgeDrawX += badgeSize + badgeSpacing;
            badgeCount++;
            if (isMobile && badgeCount % badgeWrapLimit === 0) {
              badgeDrawX = usernameX;
              badgeDrawY += badgeSize + Math.round(width * 0.01);
            }
          } catch {
            badgeDrawX += badgeSize + badgeSpacing;
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
  const gradoX = overlayX + Math.round(width * 0.033);
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

  // XP Bar background
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

  // XP Bar fill
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

  // XP Text
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
  ctx.fillText(
    xpText,
    barX + barWidth / 2,
    barY + barHeight - Math.round(barHeight * 0.25)
  );

  // Return as Discord attachment
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'xp-widget.png' });
}
