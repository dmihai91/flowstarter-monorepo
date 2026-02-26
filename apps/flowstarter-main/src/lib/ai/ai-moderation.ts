/* eslint-disable @typescript-eslint/no-explicit-any */
import { models } from '@/lib/ai/openrouter-client';
import { generateText } from 'ai';

// Define ModerationResult interface manually to avoid Zod complexity
export interface ModerationResult {
  isProhibited?: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons?: string[];
  riskScore?: number;
  categories?: string[];
  recommendation?: 'APPROVED' | 'REVIEW_REQUIRED' | 'REQUEST_REJECTED';
}

export async function aiModerateContent(input: {
  description: string;
  industry?: string;
  businessType?: string;
  goals?: string;
  services?: string;
}): Promise<ModerationResult> {
  // 1) Fast keyword pre-screen (conservative). If matched, short-circuit as prohibited.
  const text = `${input.description || ''} ${
    input.services || ''
  }`.toLowerCase();
  const keywordPatterns: RegExp[] = [
    /onlyfans?/i,
    /spicy\s+girls?/i,
    /adult\s*chat/i,
    /chat\s+with\s+fans/i,
    /cam(girl|boy)?/i,
    /web\s*cam/i,
    /escort/i,
    /prostitut/i,
    /porn/i,
    /nude|nudity|explicit/i,
    /sex\s*work|sex\s*worker/i,
    /erotic|fetish|sexting/i,
    /strip(per)?/i,
  ];
  if (keywordPatterns.some((re) => re.test(text))) {
    return {
      isProhibited: true,
      riskLevel: 'HIGH',
      reasons: [
        'Detected adult/sexual services or explicit content (keyword pre-screen)',
      ],
      riskScore: 90,
      categories: ['adult-explicit', 'sexual-services'],
      recommendation: 'REQUEST_REJECTED',
    };
  }

  const systemPrompt = [
    'You are a strict content policy moderator for Flowstarter, a website builder.',
    'Determine if the requested website or business violates platform policy or applicable laws.',
    'Prohibited examples (not exhaustive): adult chat sites, OnlyFans-style models, "spicy girls" chatting with fans, explicit sexual services, escorting, pornography, nude content, sexting, cam sites, sexualized fan interactions, or facilitating sexual services.',
    'Other prohibited categories to consider: illegal drugs, weapons, violence, child exploitation, non-consensual content, gambling (where illegal), fraud, videochat sexual content, financial crimes, counterfeit goods, hacking/cybercrime, human/organ/wildlife trafficking, terrorism, hate or extremist content, discriminatory practices.',
    'Be conservative: if uncertain, set recommendation to REVIEW_REQUIRED.',
    'Return ONLY a plain JSON object (no markdown code blocks) with properties: isProhibited (boolean), riskLevel (LOW/MEDIUM/HIGH/CRITICAL), reasons (array of strings), riskScore (0-100), categories (array), recommendation (APPROVED/REVIEW_REQUIRED/REQUEST_REJECTED).',
  ].join('\n');

  const userSummary = `Business description: ${input.description}\nIndustry: ${
    input.industry || ''
  }\nBusiness type: ${input.businessType || ''}\nGoals: ${
    input.goals || ''
  }\nServices: ${input.services || ''}`;

  try {
    const { text } = await generateText({
      model: models.gpt4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userSummary },
      ],
      temperature: 0,
    });

    // Parse the JSON response - handle markdown code blocks if present
    let jsonText = text.trim();

    // Remove markdown code block markers if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(jsonText) as ModerationResult;
    // Normalize conservatively: treat non-APPROVED or HIGH/CRITICAL as prohibited
    const nonApproved =
      result.recommendation && result.recommendation !== 'APPROVED';
    const highRisk =
      result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL';
    const overScore =
      typeof result.riskScore === 'number' && result.riskScore >= 60;
    if (nonApproved || highRisk || overScore) {
      return {
        ...result,
        isProhibited: true,
        reasons: result.reasons || [
          'Conservative policy block: non-approved recommendation or high risk',
        ],
      };
    }
    return result;
  } catch (error) {
    console.error('AI moderation error:', error);
    // Allow through on service failure - don't block legitimate users
    // Keyword pre-screen above catches obvious violations
    return {
      isProhibited: false,
      riskLevel: 'LOW',
      reasons: [],
      riskScore: 0,
      categories: [],
      recommendation: 'APPROVED',
    };
  }
}
