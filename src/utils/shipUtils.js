import { createCanvas, loadImage } from 'canvas';

// shipUtils.js

export async function createUsersCanva(userA, userB) {
    const width = 500;
    const height = 250;
    const avatarSize = 100;
    const padding = 30;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(0, 0, width, height);

    // Load avatars
    const [avatarA, avatarB] = await Promise.all([
        loadImage(userA.avatarUrl),
        loadImage(userB.avatarUrl)
    ]);

    // Draw avatars
    ctx.save();
    ctx.beginPath();
    ctx.arc(padding + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarA, padding, height / 2 - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(width - padding - avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarB, width - padding - avatarSize, height / 2 - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    // Draw names
    ctx.font = 'bold 24px Sans';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText(userA.name, padding + avatarSize / 2, height / 2 + avatarSize / 2 + 30);
    ctx.fillText(userB.name, width - padding - avatarSize / 2, height / 2 + avatarSize / 2 + 30);

    // Draw heart in the middle
    ctx.font = '40px Sans';
    ctx.fillText('❤️', width / 2, height / 2 + 15);

    return canvas.toBuffer('image/png');
}
