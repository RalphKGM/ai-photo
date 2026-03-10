import { generateEmbedding } from './ai/generateEmbedding.js';

export const updatePhotoDescriptions = async ({
    supabase,
    userId,
    photoId,
    literal,
    descriptive,
}) => {
    const nextLiteral = String(literal ?? '').trim();
    const nextDescriptive = String(descriptive ?? '').trim();

    if (!nextLiteral || !nextDescriptive) {
        const err = new Error('Literal and descriptive are required');
        err.status = 400;
        throw err;
    }

    const { data: photo, error: fetchError } = await supabase
        .from('photo')
        .select('id')
        .eq('id', photoId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !photo) {
        const err = new Error('Photo not found');
        err.status = 404;
        throw err;
    }

    const [literalEmbedding, descriptiveEmbedding] = await Promise.all([
        generateEmbedding(nextLiteral),
        generateEmbedding(nextDescriptive),
    ]);

    const { data: updated, error: updateError } = await supabase
        .from('photo')
        .update({
            literal: nextLiteral,
            descriptive: nextDescriptive,
            literal_embedding: literalEmbedding,
            descriptive_embedding: descriptiveEmbedding,
            updated_at: new Date().toISOString(),
        })
        .eq('id', photoId)
        .eq('user_id', userId)
        .select('id, device_asset_id, descriptive, literal, tags, category, manual_description, created_at, updated_at')
        .single();

    if (updateError) throw updateError;

    return updated;
};
