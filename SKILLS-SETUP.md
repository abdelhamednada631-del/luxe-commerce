# 🌍 Global Skills Environment — Complete Setup

**Status:** ✅ Installed & Active — 37 world-class skills available in EVERY project, automatically.

---

## What Was Installed

### 1. GitHub Spec Kit (Spec-Driven Development)
- CLI: `specify` v1.0.2 — installed globally via pip from `github/spec-kit`
- Location: `C:\Users\abdor\AppData\Roaming\Python\Python312\Scripts\specify.exe` (added to PATH)
- Usage in any project: `specify init` → then `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`

### 2. Global Skills Library — `~/.claude/skills` (37 skills)

**Official Anthropic Skills (20):**
| Skill | Purpose |
|---|---|
| `frontend-design` | World-class UI/visual design |
| `webapp-testing` | Browser automation & E2E testing |
| `mcp-builder` | Build MCP servers |
| `skill-creator` | Create new skills |
| `claude-api` | Claude API integrations |
| `docx` / `pdf` / `pptx` / `xlsx` | Document generation |
| `canvas-design` / `algorithmic-art` / `theme-factory` | Visual creativity |
| `brand-guidelines` / `internal-comms` / `doc-coauthoring` | Writing & comms |
| `web-artifacts-builder` | Interactive web artifacts |
| `academy-guide` / `slack-gif-creator` / `discernment-nudge` | Utilities |

**Superpowers Collection (14) — elite engineering workflows:**
| Skill | Purpose |
|---|---|
| `brainstorming` | Requirement exploration |
| `writing-plans` / `executing-plans` | Plan-driven development |
| `test-driven-development` | Strict TDD loop |
| `systematic-debugging` | Root-cause debugging |
| `verification-before-completion` | Never ship unverified |
| `subagent-driven-development` / `dispatching-parallel-agents` | Orchestration |
| `using-git-worktrees` / `finishing-a-development-branch` | Git mastery |
| `requesting-code-review` / `receiving-code-review` | Code review |
| `writing-skills` / `using-superpowers` | Meta-skills |

**Custom Premium Skills (4) — built for full coverage:**
| Skill | Purpose |
|---|---|
| `frontend-engineering` | React/Next/Vue/Svelte, TS discipline, Core Web Vitals, WCAG 2.2, state management |
| `backend-engineering` | API design, DB/PostgreSQL, caching, queues, auth, observability, scalability |
| `cybersecurity` | Threat modeling, OWASP Top 10 prevention, secrets, supply chain, hardening |
| `testing-excellence` | Test pyramid, Vitest/Jest/pytest/Playwright, TDD, flakiness protocol |

### 3. Roo Code Auto-Activation
- Junction: `~/.roo/skills/global-claude-skills` → `~/.claude/skills`
- **All 37 skills are automatically available in every project you open** — no per-project setup needed.

---

## How It Works
1. Skills live in one global directory: `~/.claude/skills`
2. Roo Code reads them via the junction in `~/.roo/skills`
3. When you work on any project, relevant skills auto-activate based on task context (frontend work → `frontend-engineering` + `frontend-design`, security review → `cybersecurity`, etc.)

## Updating
```bash
# Update skills (re-clone & re-copy)
git clone --depth 1 https://github.com/anthropics/skills && xcopy /e /i /y skills\* "%USERPROFILE%\.claude\skills\"
git clone --depth 1 https://github.com/obra/superpowers && xcopy /e /i /y superpowers\skills\* "%USERPROFILE%\.claude\skills\"

# Update Spec Kit
pip install --user --upgrade git+https://github.com/github/spec-kit.git
```
