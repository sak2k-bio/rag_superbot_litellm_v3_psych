import { NextRequest, NextResponse } from 'next/server';
import { RetrievalAgent } from '@/lib/agents';
import { generateTextCompletion } from '@/lib/litellm-client';
import { saveToGoogleSheets } from '@/lib/google-sheets';
import { PERSONAS } from '@/definitions/personas';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            demographics,
            clinical,
            personaId,
            topic,
            notes,
            useRag,
            manualContext,
            sessionNumber,
            depth
        } = body;

        // Depth instructions
        const depthMap: Record<number, string> = {
            1: "Concise output. Use bullet points and brief summaries. Focus on key actions.",
            2: "Standard professional output. Balanced detail.",
            3: "Detailed output. Include specific examples and rationale.",
            4: "Very detailed. Include dialogue scripts and in-depth clinical reasoning.",
            5: "Extremely detailed and stepwise. Comprehensive guide including dialogue, exact steps, and deep psychological analysis."
        };

        const depthInstruction = depthMap[depth as number] || depthMap[3];
        const sessionLabel = sessionNumber ? `SESSION NUMBER: ${sessionNumber}` : "SESSION: Intial/General";

        // Validate inputs
        if (!topic) {
            return NextResponse.json(
                { success: false, error: 'Topic/Goal is required' },
                { status: 400 }
            );
        }

        // Hash Patient ID for privacy if provided, else generic
        const patientId = createHash('sha256').update(JSON.stringify(demographics) + Date.now().toString()).digest('hex').substring(0, 8);

        // 1. Context Retrieval
        let context = "";
        let sources: Array<{ content: string;[key: string]: unknown }> = [];

        if (useRag) {
            try {
                const retrievalAgent = new RetrievalAgent();
                const keywords = `${topic} ${clinical.diagnosis || ''} ${clinical.comorbidities?.join(' ') || ''}`;
                const result = await retrievalAgent.process({ query: keywords, k: 5 });
                sources = result.documents as Array<{ content: string;[key: string]: unknown }>;
                context = sources.map((doc) => doc.content).join('\n\n');
            } catch (error) {
                console.error("RAG Retrieval failed:", error);
                context = "Error retrieving context. Relying on manual context if provided.";
            }
        } else {
            context = manualContext || "No specifically provided medical context.";
        }

        // 2. Construct Prompt
        const selectedPersona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];

        const demographicsStr = Object.entries(demographics)
            .filter(([_, v]) => v)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');

        const clinicalStr = Object.entries(clinical)
            .filter(([_, v]) => Array.isArray(v) ? v.length > 0 : v)
            .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');

        const systemPrompt = `
${selectedPersona.instruction}

You are creating a therapy session protocol for professional clinical use.

CRITICAL OUTPUT REQUIREMENTS:
1. Use SIMPLE, CLEAN formatting - this will be read by therapists, not AI systems
2. Use only these heading levels:
   - Main sections: ## Section Name
   - Subsections: ### Subsection Name
3. Use simple bullet points (-) for lists, NO nested bullets
4. Write in clear, professional paragraphs
5. NO dialogue format, NO "Therapist:" or "Patient:" labels
6. NO complex nested structures
7. Focus on: objectives, techniques, interventions, and clinical notes

OUTPUT DEPTH: ${depthInstruction}

EXAMPLE STRUCTURE:
## Session Overview
Brief description of goals and focus areas.

## Key Interventions
- Intervention 1: Description
- Intervention 2: Description

## Clinical Notes
Relevant observations and recommendations.
`;

        const userPrompt = `
${sessionLabel}

PATIENT INFORMATION:
${demographicsStr}

CLINICAL DETAILS:
${clinicalStr}

SESSION FOCUS:
${topic}

${notes ? `ADDITIONAL NOTES:\n${notes}\n` : ''}

REFERENCE CONTEXT:
${context}

Create a clear, professional therapy session protocol. Keep it simple and readable.
`;

        // 3. Generate Output
        console.log("Generating Therapy Protocol...");
        const protocol = await generateTextCompletion(userPrompt, {
            systemPrompt: systemPrompt,
            maxTokens: 4000,
            temperature: 0.7
        });

        // 4. Save to Google Sheets (Fire and forget)
        // Format demographics for readability instead of JSON
        const readableDemographics = Object.entries(demographics)
            .filter(([_, v]) => v)
            .map(([k, v]) => `${k}:${v}`)
            .join(', ');

        saveToGoogleSheets({
            timestamp: new Date().toISOString(),
            patientId: `anon-${patientId}`,
            demographics: readableDemographics,
            diagnosis: Array.isArray(clinical.diagnosis) ? clinical.diagnosis.join(', ') : clinical.diagnosis,
            protocolSummary: protocol // No truncation
        });

        return NextResponse.json({
            success: true,
            protocol,
            sources
        });

    } catch (error) {
        console.error('Therapy Craft API error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
