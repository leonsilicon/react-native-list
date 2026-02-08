[x] - Fix view config shit? this way color processing would work
[x] - Fix native modules?
[ ] - Make native modules stable & dynamic
        - Fix getConstants use case & crash
[ ] - Checkout how iOS works so i can get started designing a stable UI
[ ] - Fix the crash by delaying setting the adapter after the render phase
        - I think the issue is really that the adapter fill will be requested on layout
[ ] - Fix crash during hot reload
[ ] - try to get something working for iOS so i can hack out a stable API ?
[ ] - Try pressability stuff (even emitter - i think that should just work tbh, at least the emitting part)
[ ] - Move the commit to root into the render phase function for earlier execution
        - Would be nice to properly benchmark the diff