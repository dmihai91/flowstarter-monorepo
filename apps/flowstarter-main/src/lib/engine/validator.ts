import type {
  AssemblySpec,
  ContentMap,
  ProjectBrief,
  TemplateRegistryEntry,
  ValidationReport,
} from './contracts';

export function buildValidationReport(args: {
  projectBrief: ProjectBrief;
  assemblySpec: AssemblySpec;
  contentMap: ContentMap;
  template: TemplateRegistryEntry;
}): ValidationReport {
  const issues: ValidationReport['issues'] = [];
  const { projectBrief, assemblySpec, contentMap, template } = args;

  if (!projectBrief.siteName.trim()) {
    issues.push({
      level: 'error',
      code: 'brief.site_name_missing',
      message: 'Project brief is missing a site name.',
    });
  }

  if (!projectBrief.summary.trim()) {
    issues.push({
      level: 'error',
      code: 'brief.summary_missing',
      message: 'Project brief is missing a normalized summary.',
    });
  }

  if (!assemblySpec.pages.some((page) => page.route === '/')) {
    issues.push({
      level: 'error',
      code: 'assembly.homepage_missing',
      message: 'Assembly spec must include a homepage route.',
    });
  }

  if (!contentMap.entries.length) {
    issues.push({
      level: 'error',
      code: 'content_map.empty',
      message: 'Content map is empty.',
    });
  }

  if (
    projectBrief.goal === 'bookings' &&
    !template.capability.supportsBooking
  ) {
    issues.push({
      level: 'warning',
      code: 'template.booking_missing',
      message: 'Selected template does not expose booking natively.',
    });
  }

  if (!template.capability.supportsContactForm) {
    issues.push({
      level: 'warning',
      code: 'template.contact_surface_missing',
      message: 'Selected template has no explicit contact form capability.',
    });
  }

  return {
    version: '1.0',
    source: 'validation-report',
    valid: issues.every((issue) => issue.level !== 'error'),
    issues,
    summary:
      issues.length === 0
        ? 'Engine artifacts passed the initial concierge validation checks.'
        : `Engine validation found ${issues.length} issue(s).`,
  };
}
