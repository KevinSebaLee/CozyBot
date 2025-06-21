import { createCanvas, loadImage } from 'canvas';

/**
 * Joins two images side by side and returns the result as a Buffer.
 * @param {string} imgPath1 - Path to the first image.
 * @param {string} imgPath2 - Path to the second image.
 * @returns {Promise<Buffer>} - Buffer of the joined image (PNG).
 */
export async function joinImagesSideBySide(imgPath1, imgPath2) {
    const img1 = await loadImage(imgPath1);
    const img2 = await loadImage(imgPath2);

    const width = img1.width + img2.width;
    const height = Math.max(img1.height, img2.height);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img1, 0, 0);
    ctx.drawImage(img2, img1.width, 0);

    return canvas.toBuffer('image/png');
}
