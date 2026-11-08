/**
 * @file Barrel export for the dynamic agents module.
 *
 * Agent behaviour lives entirely in `agents/*.md`. Import the loader and the
 * single script base (`dynamic.ts`) here — there are no per-role wrappers.
 */

export {
  AGENT_SCHEMA_NAMES,
  agentSearchDirs,
  defaultAgentsDir,
  getAgentDefinition,
  loadAgentDefinitions,
  overrideAgentsDir,
  parseAgentFile,
  parseAgentMarkdown,
  renderAgentTask,
  renderTaskTemplate,
} from './definitions';
export type { AgentDefinition, AgentSchemaName, LoadAgentOptions } from './definitions';
export { listAgents, parseJsonObject, runAgentById } from './dynamic';
export type { AgentCompleter, AgentMessage, DynamicAgentResult } from './dynamic';
export { parseReadinessReview, parseReportSummary, validatorForAgent } from './schema';
export type { AgentOutput, ReadinessReview, ReportSummary } from './schema';
