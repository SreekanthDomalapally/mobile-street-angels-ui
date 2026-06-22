import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const BRAND_NAVY = '#0B1B32';
const imagesDir = path.join(process.cwd(), 'assets', 'images');
const source = path.join(imagesDir, 'YouHooLogo.png');

if (!fs.existsSync(source)) {
  console.error(`Missing source logo: ${source}`);
  process.exit(1);
}

async function squareIcon(size, output, background = BRAND_NAVY) {
  await sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background,
      position: 'center',
    })
    .png()
    .toFile(output);
  console.log(`wrote ${path.relative(process.cwd(), output)} (${size}x${size})`);
}

async function adaptiveForeground(size, output) {
  const logoSize = Math.round(size * 0.62);
  const logo = await sharp(source)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(output);

  console.log(`wrote ${path.relative(process.cwd(), output)} (adaptive foreground)`);
}

async function notificationIcon(size, output) {
  const logoSize = Math.round(size * 0.72);
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .greyscale()
    .negate()
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(output);

  console.log(`wrote ${path.relative(process.cwd(), output)} (notification)`);
}

async function monochromeIcon(size, output) {
  const logoSize = Math.round(size * 0.62);
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .greyscale()
    .threshold(140)
    .negate()
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(output);

  console.log(`wrote ${path.relative(process.cwd(), output)} (monochrome)`);
}

async function main() {
  await squareIcon(1024, path.join(imagesDir, 'icon.png'));
  await squareIcon(1024, path.join(imagesDir, 'splash-icon.png'));
  await squareIcon(512, path.join(imagesDir, 'favicon.png'));
  await adaptiveForeground(1024, path.join(imagesDir, 'android-icon-foreground.png'));
  await monochromeIcon(1024, path.join(imagesDir, 'android-icon-monochrome.png'));
  await notificationIcon(96, path.join(imagesDir, 'notification-icon.png'));
  console.log('App icons generated from YouHooLogo.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
