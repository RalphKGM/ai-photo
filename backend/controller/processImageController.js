import { processImage } from '../services/processImage.js';
import { getClientAuthToken } from '../utils/getClientAuthToken.js';

export const processImageController = async (req, res) => {
    try {
        const supabase = getClientAuthToken(req, res);
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });

        console.log('device_asset_id received:', req.body.device_asset_id);

        const manualDescription = req.body.manualDescription || null;
        const device_asset_id = req.body.device_asset_id || null;

        const result = await processImage(user, supabase, req.file.buffer, device_asset_id, manualDescription);

        res.status(200).json({ message: 'Image processed successfully', photo: result });
    } catch (error) {
        if (error.message === 'DUPLICATE_IMAGE') {
            return res.status(409).json({ error: 'Duplicate image' });
        }
        console.error('error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
};