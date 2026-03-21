# Platform refactor step 1 baseline status

This file records the current baseline status from the packaged repository used for `platform_step1`.

## Observed status

### Web tests
Command attempted:
```bash
cd apps/web && npm test -- --runTestsByPath src/__tests__/browserSessionStore.test.ts src/__tests__/browserSnapshotIndex.test.ts src/__tests__/browserFactsPanel.test.ts src/__tests__/browserGraphWorkspace.test.ts
```

Observed result:
- could not run because `../../node_modules/jest/bin/jest.js` was missing
- this indicates repository dependencies were not installed in the unpacked environment

Observed error summary:
```text
Error: Cannot find module '/mnt/data/platform_work/node_modules/jest/bin/jest.js'
```

### API tests
Command availability check:
```bash
mvn -version
```

Observed result:
- could not run because `mvn` was not installed in the execution environment used for this packaging step

## Interpretation
This means the repository now has an explicit baseline workflow, but the actual baseline run still depends on local prerequisites:
- root `node_modules` installed
- Maven installed and available on `PATH`

## Next action on a developer machine
From repository root:

```bash
npm install
npm run verify:safety-net
```

If Maven is not already installed, install it first and then rerun:

```bash
cd apps/api && mvn test
```
