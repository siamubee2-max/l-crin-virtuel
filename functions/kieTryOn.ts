import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { z } from "npm:zod";

// KIE.ai API Configuration
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const JEWELRY_MODEL = 'google/imagen4-fast';

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
        let aspectRatio = '3:4'; 

        if (action === 'tryOn') {
             const placementInstructions = getPlacementInstructions(jewelryType);
             
             // Since google/imagen4-fast doesn't support image inputs directly in the 'input' object (per docs),
             // we first use an LLM with Vision to describe the scene and generate a detailed prompt.
             
             const analysisPrompt = `
                You are an expert prompt engineer for AI image generation.
                I have two images:
                1. A photo of a person (the model).
                2. A photo of a piece of jewelry (${jewelryType}).
                
                YOUR TASK: Write a highly detailed, photorealistic image generation prompt to recreate the person in image 1 wearing the jewelry from image 2.
                
                DETAILS TO INCLUDE:
                - Person: Gender, approximate age, ethnicity, hair color/style, specific facial features, skin tone, exact pose, facial expression.
                - Clothing: Describe what they are wearing in detail (color, style, neckline).
                - Background & Lighting: Describe the background, ambient light, direction of light, and mood.
                - Jewelry: Describe the ${jewelryType} in detail (material, stones, color, shape) and place it on the person according to these rules: ${placementInstructions}.
                - Style: Photorealistic, cinematic lighting, 8k, highly detailed texture.
                
                The output should be ONLY the prompt text, ready to be sent to the image generator. Start with "A photorealistic medium shot of..."
             `;

             // Call Base44 LLM (GPT-4o Vision) to generate the text prompt
             const llmResponse = await base44.integrations.Core.InvokeLLM({
                 prompt: analysisPrompt,
                 file_urls: [mImage, jImage], // Provide model first, then jewelry
             });
             
             prompt = typeof llmResponse === 'string' ? llmResponse : (llmResponse.content || "A person wearing jewelry");
             console.log("Generated Prompt for Kie:", prompt);

        } else if (action === 'adjust') {
             // For adjustment, we can't easily use text-to-image without losing coherence.
             // We'll try to describe the adjustment in the prompt if possible, or fallback to a generic prompt.
             // For now, let's regenerate with a slightly modified prompt if possible, or just error out as this model might not support simple edit.
             // Assuming we regenerate for now.
             prompt = `A photorealistic image of a person wearing ${jewelryType}, high quality, cinematic lighting.`; 
             aspectRatio = '1:1';
        } else {
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Call Kie.ai
        const requestBody = {
            model: JEWELRY_MODEL,
            input: {
                prompt: prompt,
                negative_prompt: "cartoon, illustration, animation, face deformity, bad anatomy, extra fingers, floating jewelry, unrealistic placement, blur, low quality, distorted, watermark, text, signature",
                aspect_ratio: aspectRatio,
                num_images: "1"
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