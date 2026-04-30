import { store } from '../data/store.js';
import { h } from '../utils/helpers.js';
import { detectConflicts } from '../engine/conflicts.js';

export function renderConflicts(container) {
  const conflicts = store.conflicts.length ? store.conflicts : detectConflicts();
  container.innerHTML = '';

  container.appendChild(h('h2', { className: 'page-title' }, 'Conflict Detection'));
  container.appendChild(h('p', { className: 'page-subtitle mb-24' }, 'Review and resolve scheduling conflicts.'));

  const errors = conflicts.filter(c => c.severity === 'error');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  const stats = h('div', { className: 'stats-grid' });
  stats.appendChild(sc('🔴', errors.length, 'Critical', errors.length > 0 ? 'var(--danger)' : 'var(--text)'));
  stats.appendChild(sc('🟡', warnings.length, 'Warnings', warnings.length > 0 ? 'var(--warning)' : 'var(--text)'));
  stats.appendChild(sc('📊', conflicts.length, 'Total Issues', 'var(--text)'));
  stats.appendChild(sc('✅', store.getClasses().length, 'Classes', 'var(--success)'));
  container.appendChild(stats);

  if (conflicts.length === 0) {
    container.appendChild(h('div', { className: 'card' },
      h('div', { className: 'empty-state' },
        h('div', { className: 'empty-icon' }, '🎉'),
        h('h3', {}, 'No conflicts detected!'),
        h('p', {}, 'Your timetable is clean and ready to use.')
      )
    ));
    return;
  }

  // Filter tabs
  const tabs = h('div', { className: 'tabs' });
  let activeFilter = 'all';
  const types = ['all', 'teacher', 'resource', 'unassigned', 'availability'];
  types.forEach(t => {
    const count = t === 'all' ? conflicts.length : conflicts.filter(c => c.type === t).length;
    if (count === 0 && t !== 'all') return;
    tabs.appendChild(h('div', {
      className: `tab ${t === 'all' ? 'active' : ''}`,
      onClick: e => {
        tabs.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        activeFilter = t;
        fillList(list, t === 'all' ? conflicts : conflicts.filter(c => c.type === t));
      }
    }, `${t.charAt(0).toUpperCase() + t.slice(1)} (${count})`));
  });
  container.appendChild(tabs);

  const list = h('div');
  fillList(list, conflicts);
  container.appendChild(list);
}

function fillList(el, items) {
  el.innerHTML = '';
  const icons = { teacher: '👩‍🏫', resource: '🏗️', unassigned: '📋', availability: '📅', capacity: '👥' };
  items.forEach(c => {
    el.appendChild(h('div', { className: 'conflict-item' },
      h('span', { className: 'conflict-icon' }, c.severity === 'error' ? '🔴' : '🟡'),
      h('div', { className: 'conflict-body' },
        h('div', { className: 'conflict-title' }, `${icons[c.type] || '⚠️'} ${c.message}`),
        h('div', { className: 'conflict-desc' }, c.details),
        h('div', { className: 'conflict-suggestion' }, `💡 ${c.suggestion}`),
        c.day ? h('div', { className: 'conflict-location' }, `📍 ${c.day}, Period ${(c.period || 0) + 1}`) : null
      )
    ));
  });
}

function sc(icon, value, label, color) {
  return h('div', { className: 'stat-card' },
    h('div', { className: 'stat-icon' }, icon),
    h('div', { className: 'stat-value', style: { color } }, String(value)),
    h('div', { className: 'stat-label' }, label)
  );
}
