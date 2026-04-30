import { store } from '../data/store.js';
import { h, toast, getSubjectColor } from '../utils/helpers.js';
import { generateTimetable } from '../engine/scheduler.js';
import { detectConflicts, validateMove } from '../engine/conflicts.js';

let dragData = null;

export function renderTimetable(container) {
  const tt = store.timetable;
  const hasData = Object.keys(tt).length > 0;

  if (!hasData) {
    generateTimetable();
    detectConflicts();
    toast('Timetable generated!', 'success');
  }

  container.innerHTML = '';

  // Header
  container.appendChild(h('h2', { className: 'page-title' }, 'Timetable'));
  container.appendChild(h('p', { className: 'page-subtitle mb-24' }, 'View and edit your generated timetable. Drag and drop to rearrange.'));

  // View tabs + selector row
  const toolbar = h('div', { className: 'flex justify-between items-center mb-16', style: { flexWrap: 'wrap', gap: '12px' } });

  const tabsWrap = h('div', { className: 'tabs', style: { borderBottom: 'none', marginBottom: '0' } });
  ['class', 'teacher', 'resource'].forEach(view => {
    const labels = { class: '🎓 Class', teacher: '👩‍🏫 Teacher', resource: '🏗️ Resource' };
    tabsWrap.appendChild(h('div', {
      className: `tab ${store.timetableView === view ? 'active' : ''}`,
      onClick: () => { store.timetableView = view; renderTimetable(container); }
    }, labels[view]));
  });
  toolbar.appendChild(tabsWrap);

  const controls = h('div', { className: 'flex items-center gap-8' });

  // Selector
  const sel = h('select', { className: 'form-select', style: { width: '220px' } });
  if (store.timetableView === 'class') {
    store.getClasses().forEach(c => sel.appendChild(h('option', { value: c.id, selected: store.selectedClass === c.id ? 'selected' : undefined }, c.id)));
    if (!store.selectedClass) store.selectedClass = store.getClasses()[0]?.id;
    sel.onchange = e => { store.selectedClass = e.target.value; renderTimetable(container); };
  } else if (store.timetableView === 'teacher') {
    store.teachers.forEach(t => sel.appendChild(h('option', { value: t.id, selected: store.selectedTeacher === t.id ? 'selected' : undefined }, t.name)));
    if (!store.selectedTeacher) store.selectedTeacher = store.teachers[0]?.id;
    sel.onchange = e => { store.selectedTeacher = e.target.value; renderTimetable(container); };
  } else {
    store.resources.forEach(r => sel.appendChild(h('option', { value: r.id, selected: store.selectedResource === r.id ? 'selected' : undefined }, r.name)));
    if (!store.selectedResource) store.selectedResource = store.resources[0]?.id;
    sel.onchange = e => { store.selectedResource = e.target.value; renderTimetable(container); };
  }
  controls.appendChild(sel);

  controls.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => {
    generateTimetable(); detectConflicts();
    toast('Timetable regenerated!', 'success'); renderTimetable(container);
  } }, '🔄 Regenerate'));
  toolbar.appendChild(controls);
  container.appendChild(toolbar);

  // Grid
  const wrapper = h('div', { className: 'timetable-wrapper' });
  if (store.timetableView === 'class') buildClassGrid(wrapper);
  else if (store.timetableView === 'teacher') buildTeacherGrid(wrapper);
  else buildResourceGrid(wrapper);
  container.appendChild(wrapper);

  // Conflict mini-panel
  if (store.conflicts.length > 0) {
    const panel = h('div', { className: 'card mt-24' });
    panel.appendChild(h('div', { className: 'flex justify-between items-center mb-12' },
      h('h3', { className: 'font-semibold' }, `⚠️ ${store.conflicts.length} Conflict(s)`),
      h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { store.currentView = 'conflicts'; store.notify(); } }, 'View All →')
    ));
    store.conflicts.slice(0, 3).forEach(c => {
      panel.appendChild(h('div', { className: 'conflict-item' },
        h('span', { className: 'conflict-icon' }, c.severity === 'error' ? '🔴' : '🟡'),
        h('div', { className: 'conflict-body' },
          h('div', { className: 'conflict-title' }, c.message),
          h('div', { className: 'conflict-suggestion' }, `💡 ${c.suggestion}`)
        )
      ));
    });
    container.appendChild(panel);
  }
}

function buildClassGrid(wrapper) {
  const classId = store.selectedClass;
  const tt = store.timetable;
  if (!tt[classId]) return;
  const { days } = store.school;
  const periods = store.school.periodsPerDay;
  const grid = h('div', { className: 'timetable-grid', style: { gridTemplateColumns: `100px repeat(${periods}, 1fr)` } });

  // Header
  grid.appendChild(h('div', { className: 'tt-header' }, ''));
  for (let p = 0; p < periods; p++) {
    const time = store.school.periodTimes[p];
    const hdr = h('div', { className: 'tt-header' });
    hdr.appendChild(h('div', {}, `Period ${p + 1}`));
    if (time?.start) hdr.appendChild(h('div', { style: { fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' } }, time.start));
    grid.appendChild(hdr);
  }

  days.forEach(day => {
    grid.appendChild(h('div', { className: 'tt-period-label' }, day));
    for (let p = 0; p < periods; p++) {
      const session = tt[classId]?.[day]?.[p];
      const cell = h('div', { className: 'tt-cell', dataset: { day, period: p } });
      cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drop-target'); });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
      cell.addEventListener('drop', e => handleDrop(e, classId, day, p, wrapper.parentElement));
      if (session) cell.appendChild(makeBlock(session, classId, day, p));
      grid.appendChild(cell);
    }
  });
  wrapper.appendChild(grid);
}

function buildTeacherGrid(wrapper) {
  const teacherId = store.selectedTeacher;
  const tt = store.timetable;
  const { days } = store.school;
  const periods = store.school.periodsPerDay;
  const classes = store.getClasses();
  const grid = h('div', { className: 'timetable-grid', style: { gridTemplateColumns: `100px repeat(${periods}, 1fr)` } });

  grid.appendChild(h('div', { className: 'tt-header' }, ''));
  for (let p = 0; p < periods; p++) grid.appendChild(h('div', { className: 'tt-header' }, `P${p + 1}`));

  days.forEach(day => {
    grid.appendChild(h('div', { className: 'tt-period-label' }, day));
    for (let p = 0; p < periods; p++) {
      const cell = h('div', { className: 'tt-cell' });
      const seenGroups = new Set();
      let found = null, foundClass = null;
      classes.forEach(cls => {
        const session = tt[cls.id]?.[day]?.[p];
        if (session?.teacherId === teacherId) {
          if (session.groupId && seenGroups.has(session.groupId)) return;
          if (session.groupId) seenGroups.add(session.groupId);
          found = session; foundClass = cls.id;
        }
      });
      if (found) {
        const block = makeBlock(found, foundClass, day, p);
        const classLabel = block.querySelector('.session-teacher');
        if (classLabel) classLabel.textContent = foundClass + (found.isGrouped ? ` +${(found.classes?.length || 1) - 1}` : '');
        cell.appendChild(block);
      }
      grid.appendChild(cell);
    }
  });
  wrapper.appendChild(grid);
}

function buildResourceGrid(wrapper) {
  const resourceId = store.selectedResource;
  const tt = store.timetable;
  const { days } = store.school;
  const periods = store.school.periodsPerDay;
  const classes = store.getClasses();
  const grid = h('div', { className: 'timetable-grid', style: { gridTemplateColumns: `100px repeat(${periods}, 1fr)` } });

  grid.appendChild(h('div', { className: 'tt-header' }, ''));
  for (let p = 0; p < periods; p++) grid.appendChild(h('div', { className: 'tt-header' }, `P${p + 1}`));

  days.forEach(day => {
    grid.appendChild(h('div', { className: 'tt-period-label' }, day));
    for (let p = 0; p < periods; p++) {
      const cell = h('div', { className: 'tt-cell' });
      const seenGroups = new Set();
      classes.forEach(cls => {
        const session = tt[cls.id]?.[day]?.[p];
        if (session?.resourceId === resourceId) {
          if (session.groupId && seenGroups.has(session.groupId)) return;
          if (session.groupId) seenGroups.add(session.groupId);
          cell.appendChild(makeBlock(session, cls.id, day, p));
        }
      });
      grid.appendChild(cell);
    }
  });
  wrapper.appendChild(grid);
}

function makeBlock(session, classId, day, period) {
  const subject = store.getSubjectById(session.subjectId);
  const teacher = store.getTeacherById(session.teacherId);
  const color = getSubjectColor(subject);

  const block = h('div', {
    className: `session-block sb-${color} ${session.isGrouped ? 'grouped' : ''}`,
    draggable: 'true',
    dataset: { classId, day, period: String(period) }
  });
  block.appendChild(h('div', { className: 'session-subject' }, subject?.name || session.subjectId));
  block.appendChild(h('div', { className: 'session-teacher' }, teacher?.name?.split(' ').pop() || ''));

  block.addEventListener('dragstart', e => {
    dragData = { classId, day, period, session };
    block.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  block.addEventListener('dragend', () => { block.classList.remove('dragging'); dragData = null; });
  return block;
}

function handleDrop(e, targetClassId, targetDay, targetPeriod, container) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-target');
  if (!dragData) return;
  const { classId: srcClass, day: srcDay, period: srcPeriod } = dragData;
  if (srcClass !== targetClassId) { toast('Cannot move sessions between classes', 'warning'); return; }
  if (srcDay === targetDay && srcPeriod === targetPeriod) return;

  const validation = validateMove(srcClass, srcDay, srcPeriod, targetDay, targetPeriod);
  if (!validation.valid) { toast(validation.errors[0], 'error'); return; }
  if (validation.warnings.length) toast(validation.warnings[0], 'warning');

  const tt = store.timetable;
  const srcSession = tt[srcClass][srcDay][srcPeriod];
  const tgtSession = tt[targetClassId][targetDay][targetPeriod];
  tt[targetClassId][targetDay][targetPeriod] = srcSession;
  tt[srcClass][srcDay][srcPeriod] = tgtSession || undefined;
  if (!tgtSession) delete tt[srcClass][srcDay][srcPeriod];

  store.save(); detectConflicts();
  toast('Session moved!', 'success');
  renderTimetable(container);
  dragData = null;
}
