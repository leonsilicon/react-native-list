import { stripFlowPlugin } from "./strip-flow-plugin.js";

console.log('Building ReactFabricMirror worklet...')
const res = await Bun.build({
  entrypoints: ['src/ReactFabricMirror.js'],
  outdir: './src',
  naming: 'ReactFabricMirror.bundle.js',
  format: 'cjs',
  plugins: [stripFlowPlugin],
  banner: `
  const capturedManager = nativeFabricUIManager;
  
  export function setupWorklet() {
    "worklet";
  global.nativeFabricUIManager = capturedManager;
  var IS_REACT_ACT_ENVIRONMENT = false;
  var reportError = console.error;
  var MessageChannel = undefined;
  var __REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  var AbortController = undefined;

    `,
  footer: `}`,
  
})
console.log('ReactFabricMirror worklet built.', res)
