import 'server-only';

import { enrichProject, type EnrichmentResult } from '@/lib/ai/enrich-project';
import {
  type EngineArtifacts,
  type IntakeInput,
  EngineArtifactsSchema,
} from './contracts';
import { buildProjectBrief } from './intake';
import { buildAssemblySpec, buildContentMap } from './planner';
import { selectTemplate } from './template-selector';
import { loadTemplateRegistry } from './template-registry';
import { buildValidationReport } from './validator';

export type ConciergePipelineResult =
  | { status: 'needsMoreInfo'; followUpQuestions: string[] }
  | ({ status: 'complete' } & EngineArtifacts);

export async function runConciergePipeline(
  intake: IntakeInput
): Promise<ConciergePipelineResult> {
  const enriched = (await enrichProject(intake.description)) as EnrichmentResult;

  if (enriched.status === 'needsMoreInfo') {
    return {
      status: 'needsMoreInfo',
      followUpQuestions: enriched.followUpQuestions,
    };
  }

  const templates = await loadTemplateRegistry();
  const projectBrief = buildProjectBrief(intake, enriched);
  const templateSelection = selectTemplate(projectBrief, templates);
  const selectedTemplate =
    templates.find(
      (template) => template.id === templateSelection.selectedTemplateId
    ) ?? templates[0];
  const assemblySpec = buildAssemblySpec(
    projectBrief,
    templateSelection,
    selectedTemplate
  );
  const contentMap = buildContentMap(projectBrief, assemblySpec);
  const validationReport = buildValidationReport({
    projectBrief,
    assemblySpec,
    contentMap,
    template: selectedTemplate,
  });

  const artifacts = EngineArtifactsSchema.parse({
    projectBrief,
    templateSelection,
    assemblySpec,
    contentMap,
    validationReport,
  });

  return {
    status: 'complete',
    ...artifacts,
  };
}
