// ConceptNet Enrichment Service
// Uses the /related endpoint to find semantically related English terms
// Results are cached in concept_cache table — each concept queried only once
// Rate limit: 3600 req/hour, 120/min — caching keeps us well within limits

const CONCEPTNET_BASE = 'https://api.conceptnet.io';

// Minimum relatedness weight to include a term (0.0 - 1.0)
// Too low = noise, too high = nothing useful
const MIN_WEIGHT = 0.5;

// Max tags to inject per concept to avoid tag bloat
const MAX_TAGS_PER_CONCEPT = 6;

// Terms too vague or common to be useful as tags
const EXCLUDE_TERMS = new Set([
    'thing', 'object', 'item', 'entity', 'something', 'anything',
    'person', 'people', 'someone', 'anyone', 'user', 'human',
    'good', 'bad', 'nice', 'great', 'many', 'much', 'more', 'very',
    'make', 'get', 'use', 'do', 'have', 'be', 'go', 'come',
    'various', 'different', 'other', 'another', 'same', 'new', 'old',
    'small', 'large', 'big', 'little', 'high', 'low',
]);

// Simple rate limiter — ensures we don't exceed 1 req/sec average
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // slightly over 1 second to be safe

async function rateLimitedFetch(url) {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
        await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL_MS - timeSinceLast));
    }
    lastRequestTime = Date.now();
    return fetch(url);
}

async function getRelatedTerms(concept) {
    const encoded = encodeURIComponent(concept.toLowerCase().replace(/[\s-]+/g, '_'));
    const url = `${CONCEPTNET_BASE}/related/c/en/${encoded}?filter=/c/en`;

    const res = await rateLimitedFetch(url);
    if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMITED');
        throw new Error(`ConceptNet fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const related = data.related || [];

    return related
        .filter(item => {
            // Must meet minimum weight threshold
            if (item.weight < MIN_WEIGHT) return false;

            // Extract term from URI like /c/en/flying
            const match = item['@id']?.match(/\/c\/en\/([^/]+)/);
            if (!match) return false;

            const term = match[1].replace(/_/g, '-').toLowerCase();

            // Skip the concept itself
            if (term === concept) return false;

            // Skip excluded terms
            if (EXCLUDE_TERMS.has(term)) return false;

            // Only latin characters, no numbers-only terms
            if (!/^[a-z][a-z0-9-]*$/.test(term)) return false;

            // Skip very short terms
            if (term.length < 3) return false;

            return true;
        })
        .slice(0, MAX_TAGS_PER_CONCEPT)
        .map(item => {
            const match = item['@id'].match(/\/c\/en\/([^/]+)/);
            return match[1].replace(/_/g, '-').toLowerCase();
        });
}

// Main export — enriches a tag string using ConceptNet
// Checks cache first, queries API if not cached, stores result
export const enrichTagsWithConceptNet = async (supabase, tags) => {
    const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const enriched = new Set(tagList);

    for (const concept of tagList) {
        // Skip very short tags, numbers, or already-compound tags
        if (concept.length < 3 || /^\d+$/.test(concept)) continue;

        try {
            // Check cache first
            const { data: cached } = await supabase
                .from('concept_cache')
                .select('enriched_tags')
                .eq('concept', concept)
                .maybeSingle();

            let conceptTags = [];

            if (cached) {
                // Cache hit
                conceptTags = cached.enriched_tags || [];
                console.log(`ConceptNet cache hit for "${concept}":`, conceptTags);
            } else {
                // Cache miss — query API
                conceptTags = await getRelatedTerms(concept);
                console.log(`ConceptNet queried for "${concept}":`, conceptTags);

                // Store result (even empty arrays get cached so we don't re-query)
                await supabase
                    .from('concept_cache')
                    .upsert({
                        concept,
                        enriched_tags: conceptTags,
                        queried_at: new Date().toISOString(),
                    }, { onConflict: 'concept' });
            }

            conceptTags.forEach(t => enriched.add(t));

        } catch (err) {
            if (err.message === 'RATE_LIMITED') {
                console.warn('ConceptNet rate limit hit — skipping remaining concepts');
                break; // Stop querying but don't fail the upload
            }
            // Any other error — skip this concept silently
            console.warn(`ConceptNet enrichment skipped for "${concept}":`, err.message);
        }
    }

    return Array.from(enriched).join(', ');
};