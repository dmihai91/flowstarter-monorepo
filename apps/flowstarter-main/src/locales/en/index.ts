import { appKeys } from './app';
import { authKeys } from './auth';
import { landingKeys } from './landing';
import { pricingKeys } from './pricing';
import { dashboardKeys } from './dashboard';
import { wizardKeys } from './wizard';
import { teamKeys } from './team';
import { editorKeys } from './editor';
import { integrationsKeys } from './integrations';
import { legalKeys } from './legal';
import { miscKeys } from './misc';

const en = {
  ...appKeys,
  ...authKeys,
  ...landingKeys,
  ...pricingKeys,
  ...dashboardKeys,
  ...wizardKeys,
  ...teamKeys,
  ...editorKeys,
  ...integrationsKeys,
  ...legalKeys,
  ...miscKeys,
} as const;

export default en;
