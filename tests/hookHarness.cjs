// Lille hook-driver til at afprøve skærmens handlinger og kø uden native runtime.
function hookHarness() {
  const values = [];
  const effects = [];
  let cursor = 0;
  let pending = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], (change) => { values[index] = typeof change === 'function' ? change(values[index]) : change; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = { current: initial };
      return values[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!values[index] || deps.some((dep, i) => dep !== values[index].deps[i])) values[index] = { callback, deps };
      return values[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!effects[index] || deps.some((dep, i) => dep !== effects[index].deps[i])) pending.push(() => {
        effects[index]?.cleanup?.(); effects[index] = { deps, cleanup: effect() };
      });
    },
  };
  return {
    hooks,
    render(run) { cursor = 0; pending = []; const output = run(); pending.forEach((effect) => effect()); return output; },
    unmount() { effects.forEach((effect) => effect.cleanup?.()); },
  };
}
module.exports = { hookHarness };
