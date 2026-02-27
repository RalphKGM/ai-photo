import { processImage } from './processImage.js';

export const batchProcessImages = async (user, supabase, files, deviceAssetIds) => {
    if (!files || files.length === 0)
        throw new Error('No image files provided');

    const ids = Array.isArray(deviceAssetIds) ? deviceAssetIds : [deviceAssetIds];

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await processImage(user, supabase, files[i].buffer, ids[i]);
            results.push({ index: i, photo: result });
        } catch (error) {
            errors.push({ index: i, error: error.message });
        }
    }

    return { results, errors };
};