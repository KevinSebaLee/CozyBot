import { createCanvas, loadImage } from 'canvas';

// shipUtils.js

export async function createUsersCanva(userA, userB, porcent) {
    const width = 500;
    const height = 250;
    const avatarSize = 140; // Increased from 100 to 140
    const padding = 30;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background with an image (cover, not stretched)
    ctx.save();
    const backgroundImage = await loadImage('https://media.discordapp.net/attachments/1358138478826622996/1385776142413336726/thumb-1920-1344249.png?ex=68574c1a&is=6855fa9a&hm=905fbdb519f56fb793e2f50ae96149b9cc704cc8663444625a854519e03ed4a0&=&width=1635&height=920');

    // Calculate aspect ratios
    const bgAspect = backgroundImage.width / backgroundImage.height;
    const canvasAspect = width / height;

    let sx = 0, sy = 0, sWidth = backgroundImage.width, sHeight = backgroundImage.height;

    if (bgAspect > canvasAspect) {
        // Background is wider than canvas: crop sides
        sWidth = backgroundImage.height * canvasAspect;
        sx = (backgroundImage.width - sWidth) / 2;
    } else {
        // Background is taller than canvas: crop top/bottom
        sHeight = backgroundImage.width / canvasAspect;
        sy = (backgroundImage.height - sHeight) / 2;
    }

    ctx.drawImage(
        backgroundImage,
        sx, sy, sWidth, sHeight,
        0, 0, width, height
    );
    ctx.restore();

    // Draw dark rounded rectangle behind avatars, heart, porcent, and names
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#18191c';
    // Rectangle covers avatars, heart/porcent, and names
    const rectHeight = 180;
    const rectY = (height - rectHeight) / 2;
    const rectX = padding / 4;
    const rectWidth = width - padding / 2;
    const radius = 40;

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(rectX + radius, rectY);
    ctx.lineTo(rectX + rectWidth - radius, rectY);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
    ctx.lineTo(rectX + radius, rectY + rectHeight);
    ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
    ctx.lineTo(rectX, rectY + radius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Load avatars
    const [avatarA, avatarB] = await Promise.all([
        loadImage(userA),
        loadImage(userB)
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

    // Draw heart in the middle
    ctx.font = '64px Sans';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', width / 2, height / 2 + 22);

    // Draw percentage below the heart
    ctx.font = 'bold 28px Sans';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    // Place percent below the heart (heart Y is height/2 + 22, so add more offset)
    ctx.fillText(`${porcent}%`, width / 2, height / 2 + 60);

    return canvas.toBuffer('image/png');
}
