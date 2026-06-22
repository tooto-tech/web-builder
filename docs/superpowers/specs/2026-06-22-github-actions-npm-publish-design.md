# GitHub Actions npm Publish Design

## Context

This repository is the source location for the `@tooto-tech/webbuilder-*` packages. The root package is private and the publishable packages live under `packages/*`.

The GitHub repository `https://github.com/tooto-tech/web-builder.git` has been added as a remote and initialized from the current local `master` branch. The next goal is to publish npm packages from GitHub Actions.

## Goals

- Add a manually triggered GitHub Actions workflow for npm publishing.
- Publish one selected workspace package per run.
- Support a safe `dry-run` mode before real publishing.
- Use npm Trusted Publishing / OIDC instead of a long-lived `NPM_TOKEN`.
- Keep version management outside the workflow. The workflow publishes the version already committed in the selected package's `package.json`.

## Non-Goals

- The workflow will not automatically bump package versions.
- The workflow will not commit changes back to the repository.
- The workflow will not publish all workspace packages in one run.
- The workflow will not replace the existing Codeup remote or local release process.

## Workflow Design

Create `.github/workflows/publish-npm-package.yml`.

The workflow uses `workflow_dispatch` with two inputs:

- `package_name`: a choice input listing the current publishable packages:
  - `@tooto-tech/webbuilder-core`
  - `@tooto-tech/webbuilder-components-basic`
  - `@tooto-tech/webbuilder-components-cms`
  - `@tooto-tech/webbuilder-global-settings`
  - `@tooto-tech/webbuilder-i18n`
  - `@tooto-tech/webbuilder-layout-template`
  - `@tooto-tech/webbuilder-publisher`
  - `@tooto-tech/webbuilder-vue`
- `mode`: a choice input with `dry-run` and `publish`, defaulting to `dry-run`.

The workflow permissions are:

- `contents: read`
- `id-token: write`

`id-token: write` is required for npm Trusted Publishing.

## Execution Flow

Each run will:

1. Check out the repository.
2. Set up Node.js 24 with npm registry URL `https://registry.npmjs.org`.
3. Enable Corepack and activate `pnpm@10.28.1`.
4. Install dependencies with `pnpm install --frozen-lockfile`.
5. Run `pnpm guard`.
6. Build `@tooto-tech/webbuilder-core` first.
7. Build the selected package.
8. Run an npm pack dry run for the selected package.
9. If `mode` is `publish`, run `npm publish --provenance --access public` in the selected package.

## Package Build Scope

The selected package build should run through pnpm filtering so workspace dependencies resolve from the current checkout.

`@tooto-tech/webbuilder-core` is built first because several packages depend on it. The selected package is then built explicitly. If the selected package is `@tooto-tech/webbuilder-core`, this second build may repeat the core build, which is acceptable for clarity.

## Trusted Publishing Setup

Before `mode: publish` can work, each package must be configured on npmjs.com with a trusted publisher that matches:

- Repository owner: `tooto-tech`
- Repository name: `web-builder`
- Workflow file: `publish-npm-package.yml`
- Environment: none, unless an environment is added later

`dry-run` mode can be used before npm trusted publishing is configured, because it does not publish.

## Error Handling

- If dependency installation, guard, build, or pack dry run fails, the workflow stops before publishing.
- If the selected package version already exists on npm, `npm publish` will fail with npm's normal duplicate-version error.
- If Trusted Publishing is not configured correctly, `npm publish` will fail during authentication.

## Verification

Local verification before pushing the workflow:

- `pnpm guard`
- `pnpm build`
- `pnpm pack:dry-run`

GitHub verification after pushing:

- Run the workflow manually with `mode: dry-run` for at least one package.
- Configure npm Trusted Publishing for the package.
- Run the workflow manually with `mode: publish`.
- Confirm the package version appears on npm.
