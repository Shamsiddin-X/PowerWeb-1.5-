/** Shared animation lifecycle. The legacy export name is retained for saved integrations. */
/** @param {Document | Element | DocumentFragment} root */
export function startClickAnimations(root = document, { editor = false } = {}) {
  const removers = [], running = [];
  const elements = editor ? [root] : [...(root.matches?.('[data-animations]') ? [root] : []), ...root.querySelectorAll('[data-animations]')];
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    removers.push(() => target.removeEventListener(event, handler));
  };
  for (const element of elements) {
    const animations = JSON.parse(element.dataset.animations || '[]');
    const host = editor ? element.closest('[data-shader-surface]') || element : element;
    const layers = animations.map((animation, index) => {
      const layer = element.querySelector(`[data-pwb-animation-layer="${index}"]`) || element;
      running.push({layer, original: layer.style.animation});
      return {animation, layer};
    });
    const play = trigger => layers.forEach(({animation, layer}) => {
      if (animation.trigger !== trigger) return;
      layer.style.animation = 'none';
      void layer.offsetWidth;
      layer.style.animation = `${animation.name} ${animation.duration}s ${animation.easing || 'ease'} ${animation.delay}s ${animation.iterationCount || 1} both`;
    });
    if (animations.some(animation => animation.trigger === 'onClick')) listen(host, 'click', () => play('onClick'));
    if (editor) {
      play('onLoad');
      if (animations.some(animation => animation.trigger === 'onHover')) {
        listen(host, 'mouseenter', () => play('onHover'));
        listen(host, 'mouseleave', () => layers.forEach(({animation,layer}) => { if(animation.trigger === 'onHover') layer.style.animation = ''; }));
      }
    }
    // IntersectionObserver works in desktop WebViews without CSS view timelines too.
    if (animations.some(animation => animation.trigger === 'onScroll')) {
      if (typeof IntersectionObserver === 'undefined') play('onScroll');
      else {
        const observer = new IntersectionObserver(entries => {
          if(entries.some(entry => entry.isIntersecting)) { play('onScroll'); observer.disconnect(); }
        }, {threshold: 0.1});
        observer.observe(element);removers.push(() => observer.disconnect());
      }
    }
  }
  return () => {
    removers.forEach(remove => remove());
    running.forEach(({layer, original}) => { layer.style.animation = original; });
  };
}
