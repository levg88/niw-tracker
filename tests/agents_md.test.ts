import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  getAgentDefinition,
  listAgents,
  loadAgentDefinitions,
  parseAgentMarkdown,
  renderAgentTask,
  renderTaskTemplate,
  runAgentById,
  validatorForAgent,
} from '../src/agents';

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'niw-agents-'));
}

const OVERRIDE = `---
id: readiness_reviewer
name: Custom Reviewer
role: readiness_reviewer
description: A user override.
schema: readiness_review
workflow: niw_review
temperature: 0.7
max_tokens: 512
---

# System Prompt

You are a custom readiness reviewer.

# Task

Review {{item_slug}} for {{audience}}.
`;

describe('markdown agent definitions', () => {
  it('loads the bundled agents from agents/*.md', () => {
    const definitions = loadAgentDefinitions();
    expect(definitions.map((definition) => definition.id).sort()).toEqual([
      'readiness_reviewer',
      'report_synthesizer',
    ]);

    const reviewer = getAgentDefinition('readiness_reviewer');
    expect(reviewer.name).toBe('Readiness Reviewer');
    expect(reviewer.schema).toBe('readiness_review');
    expect(reviewer.workflow).toBe('niw_review');
    expect(reviewer.temperature).toBe(0.2);
    expect(reviewer.maxTokens).toBeNull();
    expect(reviewer.systemPrompt).toContain('informational');
    expect(reviewer.taskTemplate).toContain('{{evidence_item}}');
  });

  it('resolves named output validators and treats none as free text', () => {
    const reviewer = getAgentDefinition('readiness_reviewer');
    expect(validatorForAgent(reviewer)).toBeDefined();
    const free = parseAgentMarkdown(
      '---\nid: free\nschema: none\n---\n\n# System Prompt\nHi.\n\n# Task\nDo {{thing}}.',
      'free.md',
    );
    expect(validatorForAgent(free)).toBeUndefined();
  });

  it('renders task placeholders, including JSON values', () => {
    const rendered = renderTaskTemplate('Item: {{ slug }}. Data: {{data}}. Missing: {{x}}', {
      slug: 'passport-identity',
      data: { score: 80 },
    });
    expect(rendered).toContain('Item: passport-identity.');
    expect(rendered).toContain('"score": 80');
    expect(rendered).toContain('{{x}}');
  });

  it('lets an override directory replace a bundled definition', () => {
    const directory = tempDir();
    try {
      fs.writeFileSync(path.join(directory, 'readiness-reviewer.md'), OVERRIDE);
      const definitions = loadAgentDefinitions({ extraDirs: [directory] });
      const reviewer = definitions.find(
        (definition) => definition.id === 'readiness_reviewer',
      );
      expect(reviewer?.name).toBe('Custom Reviewer');
      expect(reviewer?.temperature).toBe(0.7);
      expect(reviewer?.maxTokens).toBe(512);
      expect(reviewer?.systemPrompt).toBe('You are a custom readiness reviewer.');
      expect(reviewer?.sourcePath).toBe(path.join(directory, 'readiness-reviewer.md'));
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('runs any definition dynamically with an injected completer', async () => {
    const calls: Array<{ system: string; user: string }> = [];
    const result = await runAgentById(
      'readiness_reviewer',
      {
        item_slug: 'passport-identity',
        evidence_item: { title: 'Passport' },
        checklist_state: ['checked'],
        documents: [],
        current_score: 25,
        current_status: 'needs_improvement',
      },
      async (messages) => {
        calls.push({ system: messages[0].content, user: messages[1].content });
        return JSON.stringify({
          slug: 'passport-identity',
          score: 25,
          status: 'needs_improvement',
          summary: 'Needs work.',
          evidenceGaps: ['No document uploaded'],
          recommendations: ['Upload the biographical page'],
        });
      },
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].user).toContain('passport-identity');
    expect(result.data?.slug).toBe('passport-identity');
    expect(result.definition.schema).toBe('readiness_review');
  });

  it('lists agents for tooling', () => {
    expect(listAgents().map((agent) => agent.id).sort()).toEqual([
      'readiness_reviewer',
      'report_synthesizer',
    ]);
  });

  it('rejects a definition without a system prompt', () => {
    expect(() =>
      parseAgentMarkdown('---\nid: broken\n---\n\n# Task\nDo {{thing}}.', 'broken.md'),
    ).toThrow(/missing a system prompt/);
  });

  it('rejects an unknown output schema', () => {
    expect(() =>
      parseAgentMarkdown(
        '---\nid: broken\nschema: nonsense\n---\n\n# System Prompt\nHi.',
        'broken.md',
      ),
    ).toThrow(/unknown schema/);
  });

  it('fails clearly when a task section is missing', () => {
    const definition = parseAgentMarkdown(
      '---\nid: no_task\n---\n\n# System Prompt\nHi.',
      'no_task.md',
    );
    expect(() => renderAgentTask(definition, {})).toThrow(/missing a "# Task" section/);
  });

  it('rejects invalid dynamic output', async () => {
    await expect(
      runAgentById(
        'readiness_reviewer',
        {
          item_slug: 'x',
          evidence_item: {},
          checklist_state: [],
          documents: [],
          current_score: 0,
          current_status: 'missing',
        },
        async () => JSON.stringify({ slug: 'x', score: 'high', status: 'missing', summary: 's', evidenceGaps: [], recommendations: [] }),
      ),
    ).rejects.toThrow(/field 'score'/);
  });
});
