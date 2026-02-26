import { generateEmbedding } from './ai/generateEmbedding.js';

const DISH_TAGS = [
    'pork-adobo', 'chicken-adobo', 'beef-adobo',
    'sinigang', 'pork-sinigang', 'beef-sinigang', 'shrimp-sinigang',
    'bicol-express', 'kare-kare', 'lechon', 'pinakbet',
    'chicken-curry', 'tinola', 'bulalo', 'caldereta',
    'pancit', 'lumpia', 'sisig', 'dinuguan', 'nilaga',
];

function detectDishTag(query) {
    const q = query.toLowerCase().replace(/\s+/g, '-');
    const qWords = query.toLowerCase().split(/\s+/);
    return DISH_TAGS.find(tag => {
        const tagWords = tag.split('-');
        return q.includes(tag) || tagWords.every(w => qWords.includes(w));
    }) || null;
}

export const searchImage = async (user, supabase, query) => {
    if (!query || query.trim() === '') {
        const { data, error } = await supabase
            .from('photo')
            .select('id, device_asset_id, descriptive, literal, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { results: data, count: data?.length || 0 };
    }

    // Specific dish — use tag filter, bypass vector entirely
    const dishTag = detectDishTag(query.trim());
    if (dishTag) {
        console.log('Dish query detected:', dishTag);
        const { data, error } = await supabase
            .from('photo')
            .select('id, device_asset_id, descriptive, literal, created_at, tags')
            .eq('user_id', user.id)
            .ilike('tags', `%${dishTag}%`);

        if (error) throw error;
        return { results: data || [], count: data?.length || 0 };
    }

    // General query — use hybrid search (FTS + semantic)
    console.log('Hybrid search:', query);
    const queryEmbedding = await generateEmbedding(query);

const { data, error } = await supabase.rpc('hybrid_search_photos', {
    query_text: query,
    query_embedding: queryEmbedding,
    match_count: 20,
    user_id: user.id,
    full_text_weight: 1,
    semantic_weight: 2,
    rrf_k: 50,
});

console.log('hybrid result count:', data?.length, 'error:', error);

    if (error) throw error;
    return { results: data || [], count: data?.length || 0 };
};