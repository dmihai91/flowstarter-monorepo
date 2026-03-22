import type {
  AssemblySpec,
  ContentMap,
  ProjectBrief,
  TemplateRegistryEntry,
  TemplateSelection,
  ValidationCheck,
  ValidationReport,
} from './contracts';

function summarize(checks: ValidationCheck[]): ValidationReport['status'] {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  return 'pass';
}

export function validateFlowstarterArtifacts(args: {
  projectBrief: ProjectBrief;
  templateSelection: TemplateSelection;
  assemblySpec: AssemblySpec;
  contentMap?: ContentMap;
  registry?: TemplateRegistryEntry[];
}): ValidationReport {
  const checks: ValidationCheck[] = [];
  const { projectBrief, templateSelection, assemblySpec, contentMap, registry } = args;

  checks.push({
    id: 'brief-name',
    status: projectBrief.projectName.trim() ? 'pass' : 'fail',
    message: projectBrief.projectName.trim()
      ? 'Project brief includes a project name'
      : 'Project brief is missing a project name',
  });

  checks.push({
    id: 'brief-summary',
    status: projectBrief.summary.trim() ? 'pass' : 'fail',
    message: projectBrief.summary.trim()
      ? 'Project brief includes a summary'
      : 'Project brief is missing a summary',
  });

  const selectedTemplateExists = registry
    ? registry.some((entry) => entry.slug === templateSelection.templateSlug)
    : true;

  checks.push({
    id: 'template-selection',
    status: selectedTemplateExists ? 'pass' : 'warn',
    message: selectedTemplateExists
      ? `Template ${templateSelection.templateSlug} is available`
      : `Template ${templateSelection.templateSlug} was not found in the local registry`,
  });

  checks.push({
    id: 'assembly-home',
    status: assemblySpec.pages.some((page) => page.path === '/') ? 'pass' : 'fail',
    message: assemblySpec.pages.some((page) => page.path === '/')
      ? 'Assembly spec includes a home page'
      : 'Assembly spec is missing a home page',
  });

  checks.push({
    id: 'assembly-sections',
    status: assemblySpec.pages.every((page) => page.sections.length > 0) ? 'pass' : 'fail',
    message: assemblySpec.pages.every((page) => page.sections.length > 0)
      ? 'Each page has at least one planned section'
      : 'At least one page is missing planned sections',
  });

  if (contentMap) {
    checks.push({
      id: 'content-map',
      status: contentMap.entries.length > 0 ? 'pass' : 'warn',
      message:
        contentMap.entries.length > 0
          ? 'Content map contains generated slot values'
          : 'Content map is empty',
    });
  }

  checks.push({
    id: 'integration-coverage',
    status: projectBrief.constraints.requiredIntegrations.every((required) =>
      assemblySpec.integrations.some((integration) => integration.kind === required)
    )
      ? 'pass'
      : 'fail',
    message: projectBrief.constraints.requiredIntegrations.every((required) =>
      assemblySpec.integrations.some((integration) => integration.kind === required)
    )
      ? 'Assembly spec includes all required integrations'
      : 'Assembly spec is missing at least one required integration',
  });

  return {
    version: 'v1',
    status: summarize(checks),
    checks,
  };
}
