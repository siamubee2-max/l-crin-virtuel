import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { z } from "npm:zod";

// KIE.ai API Configuration
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const JEWELRY_MODEL = 'openai/gpt-4o-image'; // Best price at $0.03/image

const MAX_POLLING_ATTEMPTS = 60;
const POLLING_INTERVAL = 2000;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getPlacementInstructions(jewelryType) {
    const instructions = {
        earrings: `Place the earrings exactly at the earlobe piercing points. Size them proportionally (1/4 to 1/2 of ear height). Ensure symmetry for both ears and follow any head tilt angle.`,
        necklace: `Place the necklace chain in the suprasternal notch (neck hollow). The pendant should hang centered on the chest. The chain must wrap around the neck naturally following its cylindrical shape.`,
        ring: `Place the ring on the appropriate finger with the band wrapping around naturally. Size it proportionally to the finger and match the hand angle and perspective.`,
        bracelet: `Place the bracelet just above the wrist bone with natural drape following gravity. It should have slight looseness and follow the wrist angle.`,
        anklet: `Place the anklet above the ankle bone with the delicate chain draping naturally. Size it proportionally to the ankle width.`,
        set: `Place all jewelry pieces: earrings at earlobes symmetrically, necklace in neck hollow with centered pendant. Ensure all pieces are coordinated in style.`,
    };
    return instructions[jewelryType] || instructions['set'];
}

async function pollTaskStatus(taskId, apiKey) {
    const statusUrl = KIE_STATUS_URL;

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
        await delay(POLLING_INTERVAL);

        try {
            const response = await fetch(statusUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ taskId }),
            });

            if (!response.ok) {
                console.warn(`[KIE Backend] Poll request failed: ${response.status}`);
                continue;
            }

            const result = await response.json();

            if (result.data?.status === 'completed' && result.data.output && result.data.output.length > 0) {
                return result.data.output[0];
            }

            if (result.data?.status === 'failed') {
                throw new Error(result.data.error || 'Le traitement a échoué');
            }
        } catch (error) {
            console.warn('[KIE Backend] Poll error:', error);
            if (error.message === 'Le traitement a échoué') throw error;
        }
    }
    throw new Error('Le traitement a pris trop de temps.');
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
        if (!KIE_API_KEY) return Response.json({ error: 'Service KIE non configuré.' }, { status: 500 });

        const payload = await req.json();
        const { action = 'tryOn', jewelryImage, modelImage, jewelryType, adjustmentType, params } = payload;

        // Ensure images are formatted correctly (URL or Data URI)
        const formatImage = (img) => {
            if (!img) return '';
            if (img.startsWith('http')) return img;
            if (img.startsWith('data:')) return img;
            return `data:image/jpeg;base64,${img}`;
        };

        const jImage = formatImage(jewelryImage);
        const mImage = formatImage(modelImage);

        let prompt = '';
        let size = '1024x1536'; // Portrait for try-on

        if (action === 'tryOn') {
             const placementInstructions = getPlacementInstructions(jewelryType);
             prompt = `Virtual jewelry try-on: Take the ${jewelryType} from the first image and place it naturally on the person in the second image.

${placementInstructions}

CRITICAL REQUIREMENTS:
- PRESERVE the person's face, expression, pose, clothing, and background EXACTLY
- SIZE the jewelry realistically for this person's body proportions
- MATCH lighting, shadows, and reflections to the original photo
- The jewelry must look physically attached, not floating
- Result must be PHOTOREALISTIC

Generate a high-quality image of the person wearing the jewelry.`;
        } else if (action === 'adjust') {
            // Logic for adjustment
            let adjustmentPrompt = '';
            switch (adjustmentType) {
                case 'position': adjustmentPrompt = 'Slightly reposition the jewelry for more natural placement.'; break;
                case 'size': adjustmentPrompt = 'Adjust the jewelry size to be more proportional.'; break;
                case 'lighting': adjustmentPrompt = 'Improve the lighting and reflections on the jewelry.'; break;
                case 'custom': adjustmentPrompt = 'Make subtle improvements to the jewelry placement.'; break;
                default: adjustmentPrompt = 'Improve the realism.';
            }
            prompt = `Image editing task: ${adjustmentPrompt}
            CRITICAL: Preserve the person's face, expression, pose, clothing, and background EXACTLY. Only modify the jewelry as instructed.`;
            
            size = '1024x1024'; // Square for adjustments usually
        } else {
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Call Kie.ai
        const requestBody = {
            model: JEWELRY_MODEL,
            input: {
                prompt: prompt,
                image_urls: action === 'tryOn' ? [jImage, mImage] : [jImage], // For tryOn we send [jewelry, model], for adjust typically just the result image to adjust? 
                // Wait, snippet says adjust takes `imageBase64` (which is likely the result of previous generation).
                // If adjust, we might need just one image? The snippet logic for adjust uses `image_urls: [imageUrl]`.
                output_format: 'png',
                size: size,
            },
        };

        const response = await fetch(KIE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${KIE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return Response.json({ error: `KIE Error: ${response.status} - ${errorText}` }, { status: 500 });
        }

        const result = await response.json();
        if (result.code !== 200 || !result.data?.taskId) {
            return Response.json({ error: result.msg || 'Task creation failed' }, { status: 500 });
        }

        const outputUrl = await pollTaskStatus(result.data.taskId, KIE_API_KEY);
        
        return Response.json({ outputUrl, success: true });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});