console.log('Building ReactFabricMirror worklet...')
const res = await Bun.build({
  entrypoints: ['src/ReactFabricMirror.js'],
  outdir: './src',
  naming: 'ReactFabricMirror.bundle.js',
  format: 'cjs',
  banner: `export function setupWorklet() {
  "worklet";
  var IS_REACT_ACT_ENVIRONMENT = false;
  var reportError = console.error;
  var MessageChannel = undefined;
  var __REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  var AbortController = undefined;

    `,
  footer: `}`,
  
})
console.log('ReactFabricMirror worklet built.', res)
