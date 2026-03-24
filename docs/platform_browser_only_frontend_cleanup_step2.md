# Browser-Only Frontend Cleanup — Step 2

## Implemented

Removed the global top-level app navigation shell from `apps/web/src/App.tsx`.

## What changed

- removed `AppNavigation` from the app shell
- removed the non-browser hero/summary shell that reinforced the multi-screen admin-console layout
- kept route handling intact for now so older route-specific screens can still render directly during the transition
- kept the Browser page styling as the single top-level shell

## Result

The app no longer presents a visible main-menu shell for Sources, Workspaces, Compare, or Operations. Browser remains the main application shell while later cleanup steps can remove the old routes themselves.

## Verification

- launch app and confirm there is no top-level navigation menu
- confirm Browser still opens normally
- confirm the Source tree dialog is still reachable from Browser
