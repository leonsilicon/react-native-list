import { existsSync } from 'node:fs'
import path from 'node:path'

const workspaceRoot = path.resolve(import.meta.dir, '..')
const reactPackagesRoot = path.join(workspaceRoot, 'third_party', 'react', 'packages')
const noopModulePath = path.join(import.meta.dir, 'shims', 'noop.js')
const reactCurrentFiberShimPath = path.join(
  import.meta.dir,
  'shims',
  'react-current-fiber.js'
)
const reactWorkTagsShimPath = path.join(import.meta.dir, 'shims', 'react-work-tags.js')
const reactFiberConfigFabricShimPath = path.join(
  import.meta.dir,
  'shims',
  'react-fiber-config-fabric.js'
)

function resolveLocalFile(basePath: string): string | null {
  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.json`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

export const reactSubmoduleResolvePlugin: Bun.BunPlugin = {
  name: 'react-submodule-resolve',
  setup(build) {
    // Resolve React monorepo-internal aliases used by react-native-renderer sources.
    build.onResolve({ filter: /^shared\// }, ({ path: importPath }) => {
      const resolved = resolveLocalFile(path.join(reactPackagesRoot, importPath))
      return resolved ? { path: resolved } : undefined
    })

    // ReactFabricEventEmitter only needs getPublicInstance from this module.
    build.onResolve({ filter: /^\.\/ReactFiberConfigFabric$/ }, ({ importer }) => {
      if (
        importer.endsWith(
          `${path.sep}third_party${path.sep}react${path.sep}packages${path.sep}react-native-renderer${path.sep}src${path.sep}ReactFabricEventEmitter.js`
        )
      ) {
        return { path: reactFiberConfigFabricShimPath }
      }
      return undefined
    })

    // Legacy event system uses these two reconciler internals in DEV only.
    build.onResolve({ filter: /^react-reconciler\/src\/ReactCurrentFiber$/ }, () => {
      return { path: reactCurrentFiberShimPath }
    })
    build.onResolve({ filter: /^react-reconciler\/src\/ReactWorkTags$/ }, () => {
      return { path: reactWorkTagsShimPath }
    })

    // Exclude RN devtools setup from this bundle path.
    build.onResolve({ filter: /setUpReactDevTools(?:\.js)?$/ }, ({ importer }) => {
      if (!importer.includes(`${path.sep}react-native${path.sep}`)) {
        return undefined
      }
      return { path: noopModulePath }
    })
  },
}
