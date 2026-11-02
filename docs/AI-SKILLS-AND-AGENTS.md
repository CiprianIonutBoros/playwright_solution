# AI Skills and Agents for the DemoShop Playwright Project

This document explains the project-specific skills and custom agents in `.github/`, how to use them, and when.

## 1. Files

| Type | Name | File |
|---|---|---|
| Skill | `demoshop-api-client` | [.github/skills/demoshop-api-client/SKILL.md](../.github/skills/demoshop-api-client/SKILL.md) |
| Skill | `demoshop-session-auth` | [.github/skills/demoshop-session-auth/SKILL.md](../.github/skills/demoshop-session-auth/SKILL.md) |
| Skill | `combined-api-ui-tests` | [.github/skills/combined-api-ui-tests/SKILL.md](../.github/skills/combined-api-ui-tests/SKILL.md) |
| Skill | `demoshop-error-contract` | [.github/skills/demoshop-error-contract/SKILL.md](../.github/skills/demoshop-error-contract/SKILL.md) |
| Skill | `playwright-page-object` | [.github/skills/playwright-page-object/SKILL.md](../.github/skills/playwright-page-object/SKILL.md) |
| Agent | `demoshop-api-explorer` | [.github/agents/demoshop-api-explorer.agent.md](../.github/agents/demoshop-api-explorer.agent.md) |
| Agent | `demoshop-test-author` | [.github/agents/demoshop-test-author.agent.md](../.github/agents/demoshop-test-author.agent.md) |
| Agent | `demoshop-test-reviewer` | [.github/agents/demoshop-test-reviewer.agent.md](../.github/agents/demoshop-test-reviewer.agent.md) |

Skills are loaded automatically when the request matches their `description`. Agents appear in the agent picker in chat.

## 2. Skills: when to use each

| Skill | Use it when |
|---|---|
| `demoshop-api-client` | Adding an endpoint, client class, or model under `src/api/clients/` |
| `demoshop-session-auth` | A test needs a signed-in user, or you see HTTP 429 |
| `combined-api-ui-tests` | Writing or changing a test in `tests/combined` |
| `demoshop-error-contract` | Asserting an error code or the matching UI message |
| `playwright-page-object` | Adding or changing a page object under `src/ui/pages/` |

Example prompts:

- "Add a CartsApi method for removing an item, following the demoshop-api-client skill."
- "Why does this test return 429? Use the demoshop-session-auth skill."
- "Add a combined test that checks the cart subtotal after removing an item."

## 3. Agents: when to use each

| Agent | Tools | Use it when |
|---|---|---|
| `demoshop-api-explorer` | read, search, web | Before writing tests, to confirm real field names, status codes, and error codes |
| `demoshop-test-author` | read, edit, search, execute | To write a new test and run it in chromium |
| `demoshop-test-reviewer` | read, search | After writing tests, to find weak assertions, login misuse, or waits (no edits) |

Recommended order for a new feature:

1. `demoshop-api-explorer` confirms the contract.
2. `demoshop-test-author` writes the test and runs chromium.
3. `demoshop-test-reviewer` reviews the change.
4. Fix the findings yourself or ask the author agent to apply them.

Example prompts:

- "Use demoshop-api-explorer to document the order list response for customers."
- "Use demoshop-test-author to add a test for an unknown cart id, using the demoshop-error-contract skill."
- "Use demoshop-test-reviewer to review tests/combined."

## 4. Rules for all AI tools in this project

- Run chromium first. Run firefox and webkit one at a time, with at least one minute between runs, because of the login limit (20 per minute).
- Do not commit `playwright/.auth/`. It is already excluded in `.gitignore`.
- Do not add `networkidle` or fixed sleeps. The UI uses SSE.
- Confirm API values in `http://localhost:3001/docs/json` before writing assertions.

## 5. Known limits

- The reviewer and explorer agents are read-only. They report findings and do not change files.
- Skill content describes the project as it was reviewed. Update the skill when the project changes (for example, after removing the duplicate helpers).
- The cart id 500 behavior and the 429 response body are documented as observed. Recheck them against the live API before relying on them.
