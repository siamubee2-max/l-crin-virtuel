import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { z } from "npm:zod";

// FASHN API Configuration
const FASHN_API_URL = 'https://api.fashn.ai/v1/run';
const FASHN_STATUS_URL = 'https://api.fashn.ai/v1/status';

// Polling configuration
const MAX_POLLING_ATTEMPTS = 60;
const POLLING_INTERVAL = 2000;
const MAX_BASE64_SIZE = 15 * 1024 * 1024; // 15MB

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Input validation schemas
const base64ImageSchema = z.string().min(10); // .max(MAX_BASE64_SIZE) - relaxed for URL usage

const categorySchema = z.enum(['auto', 'tops', 'bottoms', 'one-pieces']).default('auto');
const modeSchema = z.enum(['performance', 'balanced', 'quality']).default('balanced');
const garmentPhotoTypeSchema = z.enum(['auto', 'flat-lay', 'model']).default('auto');
const moderationLevelSchema = z.enum(['conservative', 'permissive', 'none']).default('permissive');

// Detect category from clothing type
function detectCategory(clothingType) {
    if (!clothingType) return 'auto';
    const type = clothingType.toLowerCase();

    if (
        type.includes('robe') ||
        type.includes('dress') ||
        type.includes('combinaison') ||
        type.includes('jumpsuit') ||
        type.includes('ensemble') ||
        type.includes('maillot') ||
        type.includes('bikini') ||
        type.includes('swimsuit') ||
        type.includes('one-piece')
    ) {
        return 'one-pieces';
    }

    if (
        type.includes('pantalon') ||
        type.includes('pants') ||
        type.includes('jean') ||
        type.includes('short') ||
        type.includes('jupe') ||
        type.includes('skirt') ||
        type.includes('legging') ||
        type.includes('bas') ||
        type.includes('bottom')
    ) {
        return 'bottoms';
    }

    if (
        type.includes('haut') ||
        type.includes('top') ||
        type.includes('shirt') ||
        type.includes('chemise') ||
        type.includes('blouse') ||
        type.includes('pull') ||
        type.includes('sweater') ||
        type.includes('veste') ||
        type.includes('jacket') ||
        type.includes('manteau') ||
        type.includes('coat')
    ) {
        return 'tops';
    }

    return 'auto';
}

// Poll for prediction status
async function pollPredictionStatus(predictionId, apiKey) {
    const statusUrl = `${FASHN_STATUS_URL}/${predictionId}`;

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
        await delay(POLLING_INTERVAL);

        try {
            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.warn(`[FASHN Backend] Poll request failed: ${response.status}`);
                continue;
            }

            const result = await response.json();

            if (result.status === 'completed') {
                return result;
            }

            if (result.status === 'failed') {
                throw new Error(result.error || 'Le traitement a échoué');
            }
        } catch (error) {
            console.warn('[FASHN Backend] Poll error:', error);
            // Re-throw if it's a fatal error
            if (error.message === 'Le traitement a échoué') throw error;
        }
    }

    throw new Error('Le traitement a pris trop de temps. Veuillez réessayer.');
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // Auth check
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        
        // Input validation
        const {
            modelBase64,
            garmentBase64,
            clothingType,
            mode = 'balanced',
            garmentPhotoType = 'auto',
            moderationLevel = 'permissive',
            category: explicitCategory
        } = payload;

        const FASHN_API_KEY = Deno.env.get("FASHN_API_KEY");
        if (!FASHN_API_KEY) {
            return Response.json({ error: 'Service FASHN non configuré.' }, { status: 500 });
        }

        // Determine category
        let category = explicitCategory || 'auto';
        if (clothingType && category === 'auto') {
            category = detectCategory(clothingType);
        }

        // Ensure images have proper data URI prefix if they are base64 strings and missing it
        // Note: FASHN also accepts URLs. If the input looks like a URL, use it as is.
        const formatImage = (img) => {
            if (img.startsWith('http')) return img;
            if (img.startsWith('data:')) return img;
            return `data:image/jpeg;base64,${img}`;
        };

        const modelImage = formatImage(modelBase64);
        const garmentImage = formatImage(garmentBase64);

        const requestBody = {
            model_name: 'tryon-v1.6',
            inputs: {
                model_image: modelImage,
                garment_image: garmentImage,
                category,
                mode,
                garment_photo_type: garmentPhotoType,
                moderation_level: moderationLevel,
                segmentation_free: true,
                output_format: 'jpeg',
                return_base64: false,
                num_samples: 1,
            },
        };

        const createResponse = await fetch(FASHN_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FASHN_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text().catch(() => 'Unknown error');
            console.error('[FASHN Backend] API error:', createResponse.status, errorText);
            return Response.json({ error: `Erreur FASHN: ${createResponse.status} - ${errorText}` }, { status: createResponse.status });
        }

        const prediction = await createResponse.json();

        // Check immediate completion
        if (prediction.status === 'completed' && prediction.output && prediction.output.length > 0) {
            return Response.json({
                outputUrl: prediction.output[0],
                predictionId: prediction.id,
            });
        }

        if (prediction.status === 'failed') {
            return Response.json({ error: prediction.error || 'Le traitement a échoué.' }, { status: 500 });
        }

        // Poll for completion
        const finalResult = await pollPredictionStatus(prediction.id, FASHN_API_KEY);

        if (finalResult.output && finalResult.output.length > 0) {
            return Response.json({
                outputUrl: finalResult.output[0],
                predictionId: finalResult.id,
            });
        }

        return Response.json({ error: 'Aucune image générée.' }, { status: 500 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});