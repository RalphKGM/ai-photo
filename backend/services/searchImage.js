import { isUnexpected } from "@azure-rest/ai-inference";
import { aiClient } from '../config/ai.config.js';
import { generateEmbedding } from './ai/generateEmbedding.js';

async function rerankWithGPT(query, candidates) {
    if (!candidates || candidates.length === 0) return [];

    const candidateList = candidates.map((c, i) =>
        `[${i + 1}] Tags: ${c.tags || 'none'}\nVisual: ${(c.literal || '').substring(0, 150)}\nContext: ${(c.descriptive || '').substring(0, 100)}`
    ).join('\n\n');

    try {
        const response = await aiClient.path('/chat/completions').post({
            body: {
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `You are a photo search relevance judge.

Query: "${query}"

Below are photo candidates retrieved from a search. Return ONLY the numbers of photos that genuinely match what the user is looking for. Be strict — only include photos that clearly and directly match the query.

${candidateList}

Reply with ONLY a comma-separated list of numbers (e.g. "1,3,5") or "none" if nothing matches.
Numbers only, no explanation.`
                }],
                max_tokens: 60,
            }
        });

        if (isUnexpected(response)) throw new Error('GPT rerank failed');

        const raw = response.body.choices[0].message.content?.trim();
        console.log(`Rerank: "${query}" → kept: ${raw}`);

        if (!raw || raw.toLowerCase() === 'none') return [];

        const keepIndices = new Set(
            raw.split(',')
               .map(n => parseInt(n.trim()) - 1)
               .filter(n => !isNaN(n) && n >= 0 && n < candidates.length)
        );

        return candidates.filter((_, i) => keepIndices.has(i));

    } catch (err) {
        console.warn('Rerank failed, returning all candidates:', err.message);
        return candidates;
    }
}

// search

export const searchImage = async (user, supabase, query) => {

    if (!query || query.trim() === '') {
        const { data, error } = await supabase
            .from('photo')
            .select('id, device_asset_id, descriptive, literal, tags, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { results: data, count: data?.length || 0 };
    }

    const normalizedQuery = query.trim();

    console.log(`Searching: "${normalizedQuery}"`);
    const queryEmbedding = await generateEmbedding(normalizedQuery);

    const { data, error } = await supabase.rpc('hybrid_search_photos', {
        query_text: normalizedQuery,
        query_embedding: queryEmbedding,
        match_count: 20,
        user_id: user.id,
        full_text_weight: 1.0,
        semantic_weight: 2.0,
        rrf_k: 50,
    });

    console.log(`Hybrid search results: ${data?.length ?? 0}`);
    if (error) throw error;

    if (!data || data.length === 0) {
        return { results: [], count: 0 };
    }

    const reranked = await rerankWithGPT(normalizedQuery, data);
    console.log(`After rerank: ${reranked.length} results`);

    return { results: reranked, count: reranked.length };
};