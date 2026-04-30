export function $(sel, parent = document) { return parent.querySelector(sel); }
export function $$(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

export function svgIcon(name) {
  const icons = {
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v1m0 16v1m8-10h1M5 11H4m12.4-4.4l.7-.7M7.6 14.6l-.7.7m0-9.2l.7.7m8.4 8.4l-.7-.7M12 11v.01M16 11v.01"></path></svg>',
    arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></polyline></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-10.3l3.25 3.23"></path></svg>',
    alertTriangle: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.innerHTML = icons[name] || '';
  return span;
}

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'innerHTML') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  children.flat(Infinity).forEach(c => {
    if (c == null || c === false) return;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
  });
  return el;
}

export function toggleSwitch(checked, onChange, isOrange = false) {
  const lbl = h('label', { className: 'toggle-switch' });
  const inp = h('input', { type: 'checkbox', onChange: e => onChange(e.target.checked) });
  inp.checked = !!checked;
  const slider = h('span', { className: `toggle-slider ${isOrange ? 'toggle-orange' : ''}` });
  lbl.appendChild(inp);
  lbl.appendChild(slider);
  return lbl;
}

export const COLORS = ['blue', 'green', 'purple', 'amber', 'pink', 'coral', 'teal', 'red'];

export function colorPicker(selectedColor, onChange) {
  const wrap = h('div', { className: 'color-picker' });
  COLORS.forEach(c => {
    const circle = h('div', {
      className: `color-circle ${c === selectedColor ? 'selected' : ''}`,
      style: { backgroundColor: `var(--c-${c}-bg)`, borderColor: c === selectedColor ? `var(--c-${c}-txt)` : `var(--c-${c}-txt)` },
      onClick: () => onChange(c)
    });
    wrap.appendChild(circle);
  });
  return wrap;
}
