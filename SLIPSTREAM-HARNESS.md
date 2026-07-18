# Slipstream harness customization

This project now includes local Pi resources that adapt the Slipstream Framework into the coding harness.

## Added files

```text
.pi/settings.json
.pi/skills/slipstream-engineering/SKILL.md
.pi/prompts/slipstream.md
.pi/prompts/draft-article.md
.pi/extensions/slipstream.ts
```

## What each piece does

### Skill: `slipstream-engineering`

Use with:

```text
/skill:slipstream-engineering
```

Purpose:

- Constitution-first engineering.
- Research before action.
- Personas as cognitive lenses, not roleplay.
- Adaptive workflow: Intake → Research → Pow-wow/Plan → Execution → Handoff.
- Human review gates for risky changes.
- WrestleHour-specific publishing and agent/MCP constraints.

### Prompt: `/slipstream`

Use with:

```text
/slipstream design the Railway backend
```

It asks the agent to process the task through the Slipstream phases and apply the skill if available.

### Prompt: `/draft-article`

Use with:

```text
/draft-article explain why a wrestling promotion's media strategy matters
```

It frames the output as editorial draft work only, with source-gap flags, CMS metadata, and no publishing authority.

### Extension: `.pi/extensions/slipstream.ts`

The extension injects a concise Slipstream system appendix every turn and shows a small workflow widget for non-trivial prompts involving backend, CMS, database, auth, deployment, MCP, agents, APIs, etc.

It also adds:

```text
/slipstream
```

as a command that displays the active operating protocol.

## How this maps to Slipstream

| Slipstream concept | Pi harness implementation |
| --- | --- |
| Constitution | Always-injected extension appendix + skill moral gate |
| Skills | `.pi/skills/slipstream-engineering/SKILL.md` |
| Workflows | `/slipstream` prompt template + extension reminders |
| Personas | Cognitive lenses inside the skill |
| HITL gates | Explicit instruction to ask before risky/security/publishing changes |
| Audit trail | Required `Skills applied: ...` handoff habit |
| Agent drafting | `/draft-article` prompt and backend MCP draft-only rules |

## Notes

- Project-local `.pi` resources load after the project is trusted in Pi.
- Use `/reload` in Pi after editing extensions/skills/prompts.
- The extension is intentionally lightweight; it does not orchestrate multiple agents. It internalizes the philosophy while keeping the model as the intelligence layer.
