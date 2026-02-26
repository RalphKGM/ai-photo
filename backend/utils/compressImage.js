import heicConvert from "heic-convert";
import sharp from "sharp";

const convertHeicImage = async (image) => {
    return await heicConvert({ buffer: image, format: "JPEG", quality: 1 });
};

export const getCompressedImageBuffer = async (imageBuffer) => {
    let bufferToProcess = imageBuffer;
    const isHeic = bufferToProcess.slice(4, 12).toString().includes("ftypheic");
    if (isHeic) bufferToProcess = await convertHeicImage(imageBuffer);

    const final = await sharp(bufferToProcess)
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    return final;
};

export const computePhash = async (imageBuffer) => {
    const { data, info } = await sharp(imageBuffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
    return pixels.map(p => (p >= avg ? '1' : '0')).join('');
};