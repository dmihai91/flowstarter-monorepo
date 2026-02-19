import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import {
  generateProjectName,
  extractProjectName,
  refineProjectName,
  generateFallbackName,
  type ConversationContext,
  type UserContext,
} from '~/lib/services/projectNameAgent';
import { API_MESSAGE_KEYS, getApiMessage } from '~/lib/i18n/api-messages';

const logger = createScopedLogger('api.generate-project-name');

export async function action({ context, request }: ActionFunctionArgs) {
  let projectDescription: string | undefined;

  try {
    const body = await request.json<{
      projectDescription?: string;
      templateName?: string;
      userInput?: string;
      action?: 'generate' | 'extract' | 'refine';

      // Conversational context for smarter name interpretation
      previousSuggestion?: string;

      // Refinement context (for action: 'refine')
      previousName?: string;
      refinementFeedback?: string;
      
      // Conversation history to avoid repeats and respect accumulated requirements
      previouslySuggested?: string[];
      accumulatedRequirements?: string[];
      
      // NEW: User context for personalized name generation
      userContext?: UserContext;
    }>();

    const {
      templateName,
      userInput,
      action: requestAction,
      previousSuggestion,
      previousName,
      refinementFeedback,
      previouslySuggested,
      accumulatedRequirements,
      userContext,
    } = body;
    projectDescription = body.projectDescription;

    // Handle name refinement based on user feedback
    if (requestAction === 'refine' && previousName && refinementFeedback) {
      logger.info(`Refining name "${previousName}" with feedback: "${refinementFeedback.substring(0, 50)}..."`);
      
      if (previouslySuggested?.length) {
        logger.info(`Avoiding ${previouslySuggested.length} previously suggested names`);
      }
      if (accumulatedRequirements?.length) {
        logger.info(`Respecting ${accumulatedRequirements.length} accumulated requirements`);
      }

      const result = await refineProjectName({
        previousName,
        refinementFeedback,
        projectDescription,
        previouslySuggested,
        accumulatedRequirements,
      });

      return new Response(JSON.stringify({ projectName: result.projectName }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle name extraction from natural language with conversational context
    if (requestAction === 'extract' && userInput) {
      const extractionContext: ConversationContext = {
        previousSuggestion,
        projectDescription,
        previouslySuggested,
        accumulatedRequirements,
      };

      logger.info(`Extracting name with ${previouslySuggested?.length || 0} previous suggestions, ${accumulatedRequirements?.length || 0} requirements`);

      const result = await extractProjectName(userInput, extractionContext);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    /*
     * Allow empty description - the agent will handle it by generating a generic creative name
     * if no description is provided
     */
    const descriptionToUse = projectDescription || '';

    // Log personalization if provided
    if (userContext && Object.keys(userContext).length > 0) {
      logger.info(`Generating personalized name for: ${descriptionToUse ? descriptionToUse.substring(0, 50) + '...' : 'Generic'}`);
      logger.info(`User context: ${JSON.stringify(userContext)}`);
    } else {
      logger.info(
        `Generating project name for: ${descriptionToUse ? descriptionToUse.substring(0, 50) + '...' : 'Generic (no description)'}`,
      );
    }

    const result = await generateProjectName(descriptionToUse, {
      templateName,
      userContext,
    });

    return new Response(JSON.stringify({ projectName: result.projectName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.error('Error generating project name:', error);

    // Use fallback name generator based on description if available
    const fallbackName = projectDescription ? generateFallbackName(projectDescription) : 'New Venture';

    return new Response(JSON.stringify({ projectName: fallbackName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
