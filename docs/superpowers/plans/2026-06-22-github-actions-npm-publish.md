# GitHub Actions npm Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manually triggered GitHub Actions workflow that publishes one selected `@tooto-tech/webbuilder-*` package to npm with `dry-run` and `publish` modes.

**Architecture:** The workflow is a single GitHub Actions YAML file under `.github/workflows`. It uses `workflow_dispatch` inputs to select the package and mode, uses pnpm/Corepack to install and build the workspace, and uses npm Trusted Publishing through OIDC for real publishes.

**Tech Stack:** GitHub Actions, Node.js 24, Corepack, pnpm 10.28.1, npm CLI 11.5.1 or newer, npm Trusted Publishing/OIDC.

---

## File Structure

- Create: `.github/workflows/publish-npm-package.yml`
  - Defines manual inputs, permissions, setup, validation, pack dry run, and publish command.
- Use existing: `package.json`
  - Provides `pnpm guard`, `pnpm build`, and package manager version.
- Use existing: `pnpm-lock.yaml`
  - Enables `pnpm install --frozen-lockfile` in CI.
- Use existing: `packages/*/package.json`
  - Provides package names, versions, build scripts, and `publishConfig.access`.

---

### Task 1: Add Manual npm Publish Workflow

**Files:**
- Create: `.github/workflows/publish-npm-package.yml`

- [ ] **Step 1: Create the workflow file**

Add this exact content to `.github/workflows/publish-npm-package.yml`:

```yaml
name: Publish npm package

on:
  workflow_dispatch:
    inputs:
      package_name:
        description: Package to publish
        required: true
        type: choice
        options:
          - '@tooto-tech/webbuilder-core'
          - '@tooto-tech/webbuilder-components-basic'
          - '@tooto-tech/webbuilder-components-cms'
          - '@tooto-tech/webbuilder-global-settings'
          - '@tooto-tech/webbuilder-i18n'
          - '@tooto-tech/webbuilder-layout-template'
          - '@tooto-tech/webbuilder-publisher'
          - '@tooto-tech/webbuilder-vue'
      mode:
        description: Publish mode
        required: true
        default: dry-run
        type: choice
        options:
          - dry-run
          - publish

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    name: ${{ inputs.mode }} ${{ inputs.package_name }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          package-manager-cache: false

      - name: Enable pnpm
        run: |
          corepack enable
          corepack prepare pnpm@10.28.1 --activate

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run package guard
        run: pnpm guard

      - name: Build core package
        run: pnpm --filter @tooto-tech/webbuilder-core build

      - name: Build selected package
        run: pnpm --filter "${{ inputs.package_name }}" build

      - name: Pack selected package
        run: pnpm --filter "${{ inputs.package_name }}" exec npm pack --dry-run

      - name: Publish selected package
        if: inputs.mode == 'publish'
        run: pnpm --filter "${{ inputs.package_name }}" exec npm publish --provenance --access public
```

- [ ] **Step 2: Check the workflow file is tracked as a new file**

Run:

```bash
git status --short
```

Expected output includes:

```text
?? .github/
```

or, if already added later:

```text
A  .github/workflows/publish-npm-package.yml
```

---

### Task 2: Verify Local Package Checks

**Files:**
- Use existing: `scripts/webbuilder-packages-guard.mjs`
- Use existing: `package.json`
- Use existing: `packages/*/package.json`

- [ ] **Step 1: Run package boundary guard**

Run:

```bash
pnpm guard
```

Expected: command exits with code 0.

- [ ] **Step 2: Run full workspace build**

Run:

```bash
pnpm build
```

Expected: command exits with code 0 and all packages build successfully.

- [ ] **Step 3: Run pack dry run for all packages**

Run:

```bash
pnpm pack:dry-run
```

Expected: command exits with code 0 and npm pack output is produced for the publishable workspace packages.

---

### Task 3: Commit and Push the Workflow

**Files:**
- Add: `.github/workflows/publish-npm-package.yml`
- Add: `docs/superpowers/plans/2026-06-22-github-actions-npm-publish.md`

- [ ] **Step 1: Review the final diff**

Run:

```bash
git diff -- .github/workflows/publish-npm-package.yml docs/superpowers/plans/2026-06-22-github-actions-npm-publish.md
```

Expected: diff only contains the workflow file and this implementation plan.

- [ ] **Step 2: Stage the workflow and plan**

Run:

```bash
git add .github/workflows/publish-npm-package.yml docs/superpowers/plans/2026-06-22-github-actions-npm-publish.md
```

Expected: command exits with code 0.

- [ ] **Step 3: Commit the workflow**

Run:

```bash
git commit -m "ci: add manual npm publish workflow"
```

Expected: commit succeeds and includes the workflow and implementation plan.

- [ ] **Step 4: Push to GitHub**

Run:

```bash
git push github master
```

Expected: GitHub remote receives the new commit, making the workflow visible under the repository's Actions tab.

---

### Task 4: GitHub and npm Manual Verification

**Files:**
- Use existing: `.github/workflows/publish-npm-package.yml`

- [ ] **Step 1: Run dry-run mode in GitHub Actions**

In GitHub Actions, run `Publish npm package` manually with:

```text
package_name: @tooto-tech/webbuilder-core
mode: dry-run
```

Expected: workflow completes successfully without publishing to npm.

- [ ] **Step 2: Configure npm Trusted Publishing for the package**

In npmjs.com, configure Trusted Publishing for the package being published with:

```text
Repository owner: tooto-tech
Repository name: web-builder
Workflow file: publish-npm-package.yml
Environment: none
```

Expected: npm accepts the trusted publisher configuration.

- [ ] **Step 3: Run publish mode in GitHub Actions**

In GitHub Actions, run `Publish npm package` manually with:

```text
package_name: @tooto-tech/webbuilder-core
mode: publish
```

Expected: workflow completes successfully and npm publishes the committed package version.

- [ ] **Step 4: Confirm the npm package version**

Run locally:

```bash
npm view @tooto-tech/webbuilder-core version
```

Expected: output matches `packages/webbuilder-core/package.json` version.
