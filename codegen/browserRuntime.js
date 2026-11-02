/** Optional behavior. Static content and ordinary links do not call this module. */
export function startLogic(entries, root = document, pageUrls = {}) {
  const removers = [];
  const variables = Object.create(null);
  const modals = new WeakSet();
  const find = id => id ? root.querySelector('#' + CSS.escape(id)) : null;
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    removers.push(() => target.removeEventListener(event, handler));
  };
  function conditionMatches(condition) {
    if (!condition) return true;
    const element = find(condition.elementId);
    let actual;
    switch (condition.type) {
      case 'screenWidth': actual = window.innerWidth; break;
      case 'scrollPosition': actual = window.scrollY; break;
      case 'variableEquals': actual = variables[condition.variableName]; break;
      case 'elementVisible': actual = !!element && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden'; break;
      case 'formValid': actual = find(condition.formId)?.checkValidity?.() || false; break;
      default: return false;
    }
    const expected = condition.value ?? true;
    switch (condition.operator || '===') {
      case '<': return actual < expected;
      case '>': return actual > expected;
      case '<=': return actual <= expected;
      case '>=': return actual >= expected;
      case '!==': return actual !== expected;
      default: return actual === expected;
    }
  }
  function run(actions) {
    for (const action of actions) {
      const target = find(action.targetId);
      switch (action.type) {
        case 'navigateToPage': {
          const href = pageUrls[action.targetId];
          if (href) location.assign(href);
          break;
        }
        case 'navigateToUrl': {
          try {
            const url = new URL(action.url, location.href);
            if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) window.open(url.href, '_blank', 'noopener,noreferrer');
          } catch { /* Ignore invalid links from imported documents. */ }
          break;
        }
        case 'hideElement': if (target) { target.hidden = true; target.style.display = 'none'; } break;
        case 'showModal':
          if (target) {
            target.hidden = false;
            Object.assign(target.style, { display: 'flex', visibility: 'visible', opacity: '1', zIndex: '9999', pointerEvents: 'auto' });
            target.setAttribute('role', 'dialog');
            target.setAttribute('aria-modal', 'true');
            target.tabIndex = -1;
            target.focus();
            if (!modals.has(target)) {
              const close = () => { target.hidden = true; target.style.display = 'none'; };
              listen(target, 'click', event => { if (event.target === target) close(); });
              listen(target, 'keydown', event => { if (event.key === 'Escape') close(); });
              modals.add(target);
            }
          }
          break;
        case 'setVariable': if (action.variableName) variables[action.variableName] = action.value; break;
        case 'toggleClass': if (target && action.className) action.className.split(/\s+/).filter(Boolean).forEach(name => target.classList.toggle(name)); break;
        case 'playAnimation':
          if (target && action.animationClass) {
            const classes = action.animationClass.split(/\s+/).filter(Boolean);
            target.classList.remove(...classes);
            void target.offsetWidth;
            target.classList.add(...classes);
            target.style.animationDuration ||= '1s';
            target.style.animationFillMode = 'both';
          }
          break;
      }
    }
  }
  for (const { id, logic } of entries) {
    const element = find(id);
    if (!element) continue;
    if (element.getAttribute('role') === 'button' && !['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
      listen(element, 'keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); element.click(); }
      });
    }
    for (const block of logic) {
      const type = block.event?.type;
      const handler = event => {
        if (type === 'click' || type === 'submit') event?.stopPropagation();
        if (type === 'submit') event?.preventDefault();
        run(conditionMatches(block.condition) ? block.actions : block.elseActions || []);
      };
      if (type === 'load') handler();
      else if (type === 'scroll') listen(window, 'scroll', handler);
      else if (type) listen(element, type === 'hover' ? 'mouseenter' : type, handler);
    }
  }
  return () => removers.forEach(remove => remove());
}
