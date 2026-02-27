import sharp from 'sharp';

export const getCompressedImageBuffer = async (image) => {
    const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
    return await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
};