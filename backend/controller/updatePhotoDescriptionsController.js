import { updatePhotoDescriptions } from '../services/updatePhotoDescriptions.js';
import { getClientAuthToken } from '../utils/getClientAuthToken.js';

export const updatePhotoDescriptionsController = async (req, res) => {
    try {
        const supabase = getClientAuthToken(req, res);
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { literal, descriptive } = req.body ?? {};

        const photo = await updatePhotoDescriptions({
            supabase,
            userId: user.id,
            photoId: req.params.id,
            literal,
            descriptive,
        });

        res.json({
            message: 'Photo descriptions updated successfully',
            photo,
        });
    } catch (err) {
        console.error('Update photo descriptions error:', err);
        res.status(err.status ?? 500).json({ error: err.message });
    }
};
