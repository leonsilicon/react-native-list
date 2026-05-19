import { useEffect, useRef } from 'react'
import type React from 'react'

function areDependencyListsEqual(
  currentDependencies: React.DependencyList,
  previousDependencies: React.DependencyList
) {
  if (currentDependencies.length !== previousDependencies.length) {
    return false
  }

  for (let index = 0; index < currentDependencies.length; index += 1) {
    const currentDependency = currentDependencies[index]
    const previousDependency = previousDependencies[index]
    if (!Object.is(currentDependency, previousDependency)) {
      return false
    }
  }

  return true
}

/**
 * Only runs if one of the dependencies has changed, but not on the initial render!
 */
export function useChangeEffect(
  effect: React.EffectCallback,
  dependencies: React.DependencyList
) {
  const previousDependencies = useRef<React.DependencyList | null>(null)

  useEffect(() => {
    const lastDependencies = previousDependencies.current
    previousDependencies.current = dependencies
    if (lastDependencies == null) {
      return
    }

    const dependenciesAreEqual = areDependencyListsEqual(
      dependencies,
      lastDependencies
    )
    if (dependenciesAreEqual) {
      return
    }

    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}
