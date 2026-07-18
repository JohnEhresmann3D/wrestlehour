import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SLIPSTREAM_SYSTEM_APPENDIX = `

# Project Slipstream Protocol

For this project, internalize the Slipstream Framework as an operating protocol, not a roleplay layer:

- Constitution first: safety, security, truth, maintainability, change control, and escalation.
- Research before action when APIs, deployed behavior, data, security, or architecture are involved.
- Separate Persona / Skill / Constitution:
  - Persona = cognitive lens.
  - Skill = task-scoped method.
  - Constitution = non-negotiable constraints.
- Use the lightest safe workflow:
  - trivial tasks: answer directly and truthfully;
  - non-trivial tasks: Intake → Research → Pow-wow/Plan → Execution → Handoff.
- Silent assumptions are bugs. Hallucinated APIs are failures. Hidden risk is defective engineering.
- Agents may draft and propose. Humans approve risky changes, publication, homepage curation, secrets, auth, destructive operations, and production deployment.
- For non-trivial work, leave an audit trace such as: "Skills applied: slipstream-engineering, ...".
`;

function looksNonTrivial(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return [
    "backend",
    "architecture",
    "cms",
    "database",
    "schema",
    "auth",
    "security",
    "deploy",
    "railway",
    "mcp",
    "agent",
    "publish",
    "migration",
    "integration",
    "api",
  ].some((word) => p.includes(word));
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("slipstream", "Slipstream on");
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (looksNonTrivial(event.prompt)) {
      ctx.ui.setWidget("slipstream", [
        "Slipstream: use Intake → Research → Pow-wow/Plan → Execution → Handoff for this task.",
        "Draft/propose freely; require human review for risky or publishing actions.",
      ]);
    } else {
      ctx.ui.setWidget("slipstream", undefined);
    }

    return {
      systemPrompt: event.systemPrompt + SLIPSTREAM_SYSTEM_APPENDIX,
    };
  });

  pi.registerCommand("slipstream", {
    description: "Show the active Slipstream operating protocol",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Slipstream active: constitution-first, research-before-action, personas as lenses, phased workflow, HITL gates, auditable handoff.",
        "info",
      );
      ctx.ui.setWidget("slipstream", [
        "Slipstream Protocol",
        "1. Intake: clarify goal, assumptions, acceptance criteria.",
        "2. Research: inspect files/docs/deployed behavior before claims.",
        "3. Pow-wow: challenge assumptions and plan.",
        "4. Execution: small auditable changes; fail loudly.",
        "5. Handoff: checks, risks, next steps.",
      ]);
    },
  });
}
