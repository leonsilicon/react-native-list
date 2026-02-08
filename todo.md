## Core architecture

[x] - Fix view config shit? this way color processing would work
[x] - Fix native modules?
[x] - Make native modules stable & dynamic
        - Fix getConstants use case & crash
[ ] - Checkout how iOS works so i can get started designing a stable API
[ ] - Create a "SyncRenderer" and a "SyncView", this will also help with debugging (to render just one view instead of a whole list!)
[ ] - Do I want to use the ReactFiberConfig? 


## Base functionality (what users expect to just work)

[ ] - Try pressability stuff (even emitter - i think that should just work tbh, at least the emitting part)
[ ] - Do I have to implement getPublicInstance so people can work with refs as expected?
[ ] - RNGH / reanimated (i guess?)
[ ] - When trying to use RNGH it says: Error: GestureDetector must be used as a descendant of GestureHandlerRootView. Otherwise the gestures will not be recognized. 
        - The problem is that they render a react context to check for the gesture detector
        - Either i need to add WrapperComponent prop support (i think i still have to do this)
        - But there might be other more severe issues with running RNGH

## Performance

[ ] - Create a custom view manager so i don't have to inject empty views to keep the indices correct
        - Benchmarking before after would be interesting!
        - I guess that could be huge, for 10k list items, it created 10k dummy views right now!
[ ] - Move the commit to root into the render phase function for earlier execution
        - Would be nice to properly benchmark the diff


## Stability

[ ] - Fix the crash by delaying setting the adapter after the render phase
        - I think the issue is really that the adapter fill will be requested on layout
[ ] - Fix crash during hot reload
[ ] - Test with worklets strict mode