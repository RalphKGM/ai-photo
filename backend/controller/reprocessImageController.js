import { describeImage } from '../services/ai/describeImage.js';
import { generateEmbedding } from '../services/ai/generateEmbedding.js';

export const reprocessImageController = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const supabase = req.supabase;

        if (!req.file) return res.status(400).json({ error: 'Image file required for reprocessing' });

        const { data: photo, error: fetchError } = await supabase
            .from('photo')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !photo) return res.status(404).json({ error: 'Photo not found' });

        const description = await describeImage(req.file.buffer);

        const literalStart = description.indexOf('[LITERAL]');
        const descriptiveStart = description.indexOf('[DESCRIPTIVE]');
        const tagsStart = description.indexOf('[TAGS]');

        const literal = description.substring(literalStart + 9, descriptiveStart).trim();
        const descriptive = description.substring(descriptiveStart + 13, tagsStart).trim();
        const tags = description.substring(tagsStart + 6).trim().toLowerCase();

        const [descriptiveEmbedding, literalEmbedding] = await Promise.all([
            generateEmbedding(descriptive),
            generateEmbedding(literal),
        ]);

        const { data: updated, error: updateError } = await supabase
            .from('photo')
            .update({
                descriptive,
                literal,
                tags,
                descriptive_embedding: descriptiveEmbedding,
                literal_embedding: literalEmbedding,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({ message: 'Photo reprocessed successfully', photo: updated });

    } catch (err) {
        console.error('Reprocess error:', err);
        res.status(500).json({ error: err.message });
    }
};