function runWithFiberInDEV(_fiber, fn, ...args) {
  return fn(...args)
}

module.exports = {
  runWithFiberInDEV,
}
