# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a minimal scaffold with no application source, test suite, or package manifest checked in yet. Contributors should keep the root clean and introduce structure intentionally as the project grows.

Recommended layout:
- `src/` for application code
- `tests/` for automated tests
- `assets/` or `public/` for static files
- `docs/` for design notes or architecture decisions

Place new modules near related code and prefer small, focused files over broad utility dumps.

## Build, Test, and Development Commands
There are no standard build or test commands defined in the repository yet. When adding tooling, document the canonical commands in this file and in the project README.

Common examples once tooling exists:
- `npm install` to install dependencies
- `npm run dev` to start a local development server
- `npm test` to run the test suite
- `npm run lint` to check formatting and style

If you introduce a new script, make sure it is reproducible on a clean checkout.

## Coding Style & Naming Conventions
Use consistent formatting within each language and adopt automated formatters early. Unless an added tool states otherwise, prefer:
- 2 spaces for Markdown, JSON, YAML, and frontend config files
- descriptive file names such as `game-card.tsx`, `scoreboard.test.ts`, or `seed-data.json`
- `PascalCase` for components/classes, `camelCase` for variables/functions, and `kebab-case` for file names

Avoid large mixed-purpose files. Add linting or formatting config alongside any new language/toolchain.

## Testing Guidelines
Add tests with each feature or bug fix. Keep tests in `tests/` or next to the code they cover using names like `feature-name.test.ts` or `feature-name.spec.js`.

Favor fast, deterministic tests. If coverage tooling is added, target meaningful coverage on changed code rather than relying on broad percentages alone.

## Commit & Pull Request Guidelines
Git history is not available in this workspace, so no repository-specific commit convention can be inferred. Use short, imperative commit subjects such as `Add game card component` or `Set up Vitest config`.

Pull requests should include:
- a concise summary of the change
- linked issue or task reference when applicable
- screenshots or terminal output for UI/CLI changes
- notes on new commands, config, or migration steps

## Agent-Specific Notes
Keep this file updated when the repository gains a real build system, test framework, or directory layout so contributors are not forced to reverse-engineer project conventions.
