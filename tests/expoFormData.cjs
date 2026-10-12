// Brug den installerede Expo-kode til multipart, ikke en Node-omformning af { uri }.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('@babel/core');

function createExpoFormData(globals = {}) {
  const cache = new Map();
  const root = path.resolve(__dirname, '../node_modules/expo/src');
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, configFile: false, babelrc: false,
      plugins: ['@babel/plugin-transform-typescript', '@babel/plugin-transform-modules-commonjs'],
    });
    const module = { exports: {} };
    cache.set(filename, module);
    vm.runInNewContext(`(function(require, module, exports) { ${code}\n})`, {
      Blob, TextEncoder, Uint8Array, ...globals,
    }, { filename })((name) => load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts'))), module, module.exports);
    return module.exports;
  }
  // Expo patcher React Natives FormData; kun dens tomme konstruktør er simuleret.
  class NativeFormData { constructor() { this._parts = []; } }
  const { installFormDataPatch } = load('winter/FormData.ts');
  return { FormData: installFormDataPatch(NativeFormData), ...load('winter/fetch/convertFormData.ts') };
}

module.exports = { createExpoFormData };
