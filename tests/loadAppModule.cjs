// Indlæs appens JavaScript uden at starte Expo eller kontakte eksterne tjenester.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('@babel/core');

function createLoader(mocks = {}, globals = {}) {
  const cache = new Map();
  const root = path.resolve(__dirname, '..');
  function load(name, from = root) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    const resolved = name.startsWith('.') ? path.resolve(from, name) : path.resolve(root, name);
    const filename = resolved.endsWith('.js') ? resolved : `${resolved}.js`;
    const relative = path.relative(root, filename).replaceAll(path.sep, '/');
    if (Object.hasOwn(mocks, relative)) return mocks[relative];
    if (cache.has(filename)) return cache.get(filename).exports;
    if (!fs.existsSync(filename)) return require(name);
    const source = fs.readFileSync(filename, 'utf8');
    const { code } = transformSync(source, {
      filename, configFile: false, babelrc: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
    });
    const module = { exports: {} };
    cache.set(filename, module);
    vm.runInNewContext(`(function(require, module, exports) { ${code}\n})`, {
      console, setTimeout, clearTimeout, AbortController, FormData, Blob, ...globals,
    }, { filename })((dependency) => dependency.endsWith('.png') ? 1 : load(dependency, path.dirname(filename)), module, module.exports);
    return module.exports;
  }
  return (name) => load(name);
}

module.exports = { createLoader };
