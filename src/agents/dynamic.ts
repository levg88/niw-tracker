/**
 * @file Dynamic agent runtime — the single script base.
 *
 * Any `agents/*.md` definition runs through `runAgentById` with no per-role
 * TypeScript. The caller injects a `completer` (any LLM or mock), and the
 * runtime renders the task template, calls it, parses the JSON output, and
 * validates it against the schema named in the definition's frontmatter.
 */

import {
  getAgentDefinition,
  loadAgentDefinitions,
  renderAgentTask,
  type AgentDefinition,
  type LoadAgentOptions,
} from './definitions';
import { validatorForAgent } from './schema';

/** A set of system/user messages in provider-neutral form. */
export interface AgentMessage {
  role: 'system' | 'user';
  content: string;
}

/** Call a model and return its raw text output. */
export type AgentCompleter = (
  messages: AgentMessage[],
  options: { temperature: number; maxTokens: number | null },
) => Promise<string>;

/** Outcome of a single dynamic agent run. */
export interface DynamicAgentResult {
  definition: AgentDefinition;
  systemPrompt: string;
  task: string;
  text: string;
  data: Record<string, unknown> | null;
}

/** Parse a JSON object out of model output, tolerating markdown fences. */
export function parseJsonObject(text: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = (fenced ? fenced[1] : text).trim();
  const parsed: unknown = JSON.parse(candidate);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Model output is not a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function buildMessages(definition: AgentDefinition, task: string): AgentMessage[] {
  return [
    { role: 'system', content: definition.systemPrompt.trim() },
    { role: 'user', content: task },
  ];
}

/**
 * Run any agent by id. Loads the definition, renders `{{variables}}` through
 * the definition's `# Task` template, calls `completer`, and validates JSON
 * against the declared schema — no new code per role.
 */
export async function runAgentById(
  id: string,
  variables: Record<string, unknown>,
  completer: AgentCompleter,
  options: { load?: LoadAgentOptions; workflowRunId?: number | null } = {},
): Promise<DynamicAgentResult> {
  const definition = getAgentDefinition(id, options.load);
  const task = renderAgentTask(definition, variables);
  const messages = buildMessages(definition, task);
  const raw = await completer(messages, {
    temperature: definition.temperature,
    maxTokens: definition.maxTokens,
  });
  let data: Record<string, unknown> | null = null;
  const validate = validatorForAgent(definition);
  if (validate) {
    const parsed = parseJsonObject(raw);
    data = validate(parsed) as Record<string, unknown>;
  } else {
    try {
      data = parseJsonObject(raw);
    } catch {
      data = null;
    }
  }
  return { definition, systemPrompt: definition.systemPrompt, task, text: raw, data };
}

/** List every loadable agent definition (bundled + overrides). */
export function listAgents(options: LoadAgentOptions = {}): AgentDefinition[] {
  return loadAgentDefinitions(options);
}
