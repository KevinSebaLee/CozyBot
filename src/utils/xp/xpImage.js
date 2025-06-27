import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage, Image } from 'canvas';
import axios from 'axios';
import path from 'path';
import supabase from '../../database/supabaseClient.js';
import { BASE_EXP, GROWTH_RATE } from './xpMath.js';

async function loadImageFromURL(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const img = new Image();
  img.src = Buffer.from(response.data, 'binary');
  return img;
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
    { id: 1, file: path.resolve('src/assets/badges/top1.png') },
    { id: 2, file: path.resolve('src/assets/badges/top10.png') },
    { id: 3, file: path.resolve('src/assets/badges/hablarFrost.png') },
    { id: 4, file: path.resolve('src/assets/badges/fantasma.png') },
    { id: 5, file: path.resolve('src/assets/badges/fantasmaX.png') },
    { id: 6, file: path.resolve('src/assets/badges/6.png') },
    { id: 7, file: path.resolve('src/assets/badges/activoNoche.png') },
    { id: 8, file: path.resolve('src/assets/badges/activoDia.png') },
    { id: 9, file: path.resolve('src/assets/badges/activo.png') },
  ];

  console.log(badgeList[0].file);

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = '';

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
  const badgeWrapLimit = isMobile ? 3 : 99;

  const { data: userBadges } = await supabase
    .from('user_badge')
    .select('id_badge, id_guild')
    .eq('id_user', user.id)
    .eq('id_guild', id_guild);

  let badgeCount = 0;
  for (const badge of badgeList) {
    if (userBadges && userBadges.length > 0) {
      for (let x = 0; x < userBadges.length; x++) {
        if (userBadges[x].id_badge && badge.file && userBadges[x].id_badge === badge.id) {
          try {
            const badgeImg = await loadImage(badge.file);
            ctx.drawImage(badgeImg, badgeDrawX, badgeDrawY, badgeSize, badgeSize);
          } catch (err) {
            console.error('Failed to load badge image:', badge.file, err);
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