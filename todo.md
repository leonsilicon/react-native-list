[x] - Fix view config shit? this way color processing would work
[x] - Fix native modules?
[x] - Make native modules stable & dynamic
        - Fix getConstants use case & crash
[ ] - Checkout how iOS works so i can get started designing a stable API
[ ] - Fix the crash by delaying setting the adapter after the render phase
        - I think the issue is really that the adapter fill will be requested on layout
[ ] - Fix crash during hot reload
[ ] - Try pressability stuff (even emitter - i think that should just work tbh, at least the emitting part)
[ ] - Move the commit to root into the render phase function for earlier execution
        - Would be nice to properly benchmark the diff
[ ] - Test with worklets strict mode