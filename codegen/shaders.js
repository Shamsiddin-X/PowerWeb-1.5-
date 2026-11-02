/** Shader failure leaves the original text/image/video available. */
export function startShaders(configs, root, renderShader) {
  const effects = [];
  for (const canvas of root.querySelectorAll('canvas[data-pwb-shader]')) {
    try {
      const config = configs[canvas.dataset.pwbShader];
      if (!config) continue;
      const effect = renderShader(canvas, config);
      if (effect) effects.push(effect);
    } catch (error) { console.warn('Shader unavailable', error); }
  }
  return () => effects.forEach(effect => effect.dispose());
}
