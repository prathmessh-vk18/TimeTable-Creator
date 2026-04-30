import { store, uid } from '../data/store.js';
import { h, toggleSwitch, colorPicker, svgIcon } from '../utils/helpers.js';

export function renderSetup(container) {
  const steps = ['School', 'Grades', 'Subjects', 'Teachers', 'Rooms', 'Rules'];
  const step = store.setupStep;

  container.innerHTML = '';
  const page = h('div', { className: 'fade-in' });

  // App Header
  const header = h('header', { className: 'app-header' });
  const logo = h('div', { className: 'app-logo' });
  logo.appendChild(h('div', { className: 'app-logo-icon' }, svgIcon('sparkles')));
  logo.appendChild(h('span', {}, 'ChronoClass'));
  header.appendChild(logo);
  page.appendChild(header);

  // Hero Section
  const hero = h('section', { className: 'hero-section' });
  hero.appendChild(h('h1', { className: 'hero-title' }, 'School Timetable Scheduler'));
  hero.appendChild(h('p', { className: 'hero-subtitle' }, 'Set up your school in 6 quick steps. We\'ll handle the constraints and generate an optimized schedule automatically.'));
  page.appendChild(hero);

  // Main Container
  const mainCont = h('div', { style: { maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px' } });

  // Stepper
  const stepperCont = h('div', { className: 'stepper-container mb-24' });
  const stepper = h('div', { className: 'stepper' });
  stepper.appendChild(h('div', { className: 'step-line-bg' }));
  
  const progressPct = ((step - 1) / (steps.length - 1)) * 100;
  stepper.appendChild(h('div', { className: 'step-line-fill', style: { width: `${progressPct}%` } }));

  steps.forEach((label, i) => {
    const n = i + 1;
    const cls = n < step ? 'completed' : n === step ? 'active' : '';
    const item = h('div', { className: `step-item ${cls}`, onClick: () => { store.setupStep = n; store.notify(); } },
      h('div', { className: 'step-circle' }, n < step ? svgIcon('check') : String(n)),
      h('div', { className: 'step-label' }, label)
    );
    stepper.appendChild(item);
  });
  stepperCont.appendChild(stepper);
  mainCont.appendChild(stepperCont);

  const card = h('div', { className: 'card mb-24' });
  switch (step) {
    case 1: renderSchool(card); break;
    case 2: renderGrades(card); break;
    case 3: renderSubjects(card); break;
    case 4: renderTeachers(card); break;
    case 5: renderRooms(card); break;
    case 6: renderRules(card); break;
  }
  mainCont.appendChild(card);

  // Navigation
  const nav = h('div', { className: 'flex justify-between items-center' });
  if (step > 1) {
    nav.appendChild(h('button', { className: 'btn btn-outline', onClick: () => { store.setupStep--; store.notify(); } }, '← Back'));
  } else {
    nav.appendChild(h('div'));
  }
  
  if (step < 6) {
    nav.appendChild(h('button', { className: 'btn btn-primary' }, 'Next ', svgIcon('arrowRight')));
    nav.lastChild.onclick = () => { store.setupStep++; store.notify(); };
  } else {
    nav.appendChild(h('button', { className: 'btn btn-primary btn-lg', onClick: () => startGeneration(page) }, 'Generate timetable ', svgIcon('sparkles')));
  }
  mainCont.appendChild(nav);
  page.appendChild(mainCont);
  container.appendChild(page);
}

function renderSchool(body) {
  const s = store.school;
  body.appendChild(h('h3', { className: 'card-title mb-16' }, 'School Information'));
  
  body.appendChild(fg('School Name', inp(s.name, v => s.name = v)));
  
  const r1 = h('div', { className: 'form-row-4' });
  r1.appendChild(fg('Start Time', inp(s.startTime, v => s.startTime = v, 'time')));
  r1.appendChild(fg('End Time', inp(s.endTime, v => s.endTime = v, 'time')));
  
  const durSel = h('select', { className: 'form-select', onChange: e => s.periodDuration = parseInt(e.target.value) });
  [40, 45, 50, 60].forEach(m => durSel.appendChild(h('option', { value: m }, `${m} min`)));
  durSel.value = s.periodDuration;
  r1.appendChild(fg('Period Duration', durSel));
  
  r1.appendChild(fg('Break After Period', inp(s.breakAfter, v => s.breakAfter = parseInt(v) || 4, 'number')));
  body.appendChild(r1);

  body.appendChild(h('label', { className: 'form-label mt-16' }, 'Working Days'));
  const chips = h('div', { className: 'day-chips' });
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(d => {
    const isSel = s.days.includes(d);
    chips.appendChild(h('div', { 
      className: `day-chip ${isSel ? 'selected' : ''}`, 
      onClick: () => {
        if (isSel) s.days = s.days.filter(x => x !== d);
        else s.days.push(d);
        store.notify();
      }
    }, d.slice(0,3)));
  });
  body.appendChild(chips);
}

function renderGrades(body) {
  const gList = store.grades;
  body.appendChild(h('h3', { className: 'card-title mb-16' }, 'Grades & Sections'));
  
  gList.forEach((g, i) => {
    const row = h('div', { className: 'flex items-center gap-16 mb-16' });
    row.appendChild(inp(g.name, v => g.name = v));
    
    const secWrap = h('div', { className: 'flex-1 flex flex-wrap items-center gap-8 border', style: { padding: '4px 8px', borderColor: 'var(--border-color)', background: '#fff' } });
    g.sections.forEach((sec, si) => {
      secWrap.appendChild(h('span', { className: 'chip-sec' }, sec, h('span', { className: 'chip-del', onClick: () => { g.sections.splice(si, 1); store.notify(); } }, '×')));
    });
    
    function getNextSection(sections) {
      if (!sections || sections.length === 0) return 'A';
      const last = sections[sections.length - 1];
      if (/^[A-Z]$/.test(last)) return String.fromCharCode(last.charCodeAt(0) + 1);
      return `Sec ${sections.length + 1}`;
    }
    
    const nextSec = getNextSection(g.sections);
    const addNextBtn = h('button', { 
      className: 'chip-sec', 
      style: { borderStyle: 'dashed', background: 'transparent', cursor: 'pointer', color: 'var(--color-cta)', borderColor: 'var(--color-cta)' }, 
      onClick: () => { g.sections.push(nextSec); store.notify(); } 
    }, `+ ${nextSec}`);
    
    secWrap.appendChild(addNextBtn);
    row.appendChild(secWrap);
    
    row.appendChild(h('button', { className: 'btn btn-ghost btn-icon', onClick: () => { store.grades.splice(i, 1); store.notify(); } }, svgIcon('trash')));
    body.appendChild(row);
  });
  
  body.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => { store.grades.push({ id: uid(), name: `Grade ${store.grades.length + 1}`, sections: ['A'] }); store.notify(); } }, '+ Add Grade'));
}

function renderSubjects(body) {
  body.appendChild(h('h3', { className: 'card-title mb-16' }, 'Subjects'));
  
  const tbl = h('table', { className: 'data-table mb-16' });
  tbl.innerHTML = '<thead><tr><th>Subject Name</th><th>Periods/Week</th><th>Color</th><th>Shared Session</th><th style="width:40px"></th></tr></thead>';
  const tbody = h('tbody');
  
  store.subjects.forEach((s, i) => {
    const tr = h('tr');
    tr.appendChild(h('td', {}, inp(s.name, v => s.name = v)));
    tr.appendChild(h('td', {}, inp(s.periodsPerWeek, v => s.periodsPerWeek = parseInt(v) || 1, 'number')));
    tr.appendChild(h('td', {}, colorPicker(s.color, c => { s.color = c; store.notify(); })));
    tr.appendChild(h('td', {}, toggleSwitch(s.isShared, v => { s.isShared = v; store.notify(); })));
    tr.appendChild(h('td', {}, h('button', { className: 'btn btn-ghost btn-icon', onClick: () => { store.subjects.splice(i, 1); store.notify(); } }, svgIcon('trash'))));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  body.appendChild(tbl);
  
  body.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => { store.subjects.push({ id: uid(), name: '', periodsPerWeek: 4, color: 'blue', isShared: false }); store.notify(); } }, '+ Add Subject'));
}

function renderTeachers(body) {
  body.appendChild(h('h3', { className: 'card-title mb-16' }, 'Teachers'));
  const tbl = h('table', { className: 'data-table mb-16' });
  tbl.innerHTML = '<thead><tr><th>Teacher Name</th><th>Subject</th><th style="width:40px"></th></tr></thead>';
  const tbody = h('tbody');
  
  store.teachers.forEach((t, i) => {
    const tr = h('tr');
    tr.appendChild(h('td', {}, inp(t.name, v => t.name = v)));
    
    const sel = h('select', { className: 'form-select', onChange: e => t.subjectId = e.target.value });
    sel.appendChild(h('option', { value: '' }, 'Select Subject'));
    store.subjects.forEach(s => sel.appendChild(h('option', { value: s.id }, s.name)));
    sel.value = t.subjectId || '';
    tr.appendChild(h('td', {}, sel));
    
    tr.appendChild(h('td', {}, h('button', { className: 'btn btn-ghost btn-icon', onClick: () => { store.teachers.splice(i, 1); store.notify(); } }, svgIcon('trash'))));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  body.appendChild(tbl);
  
  body.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => { store.teachers.push({ id: uid(), name: '', subjectId: null }); store.notify(); } }, '+ Add Teacher'));
}

function renderRooms(body) {
  body.appendChild(h('h3', { className: 'card-title mb-16' }, 'Rooms'));
  const tbl = h('table', { className: 'data-table mb-16' });
  tbl.innerHTML = '<thead><tr><th>Room Name</th><th>Type</th><th>Dedicated Subject</th><th style="width:40px"></th></tr></thead>';
  const tbody = h('tbody');
  
  store.rooms.forEach((r, i) => {
    const tr = h('tr');
    tr.appendChild(h('td', {}, inp(r.name, v => r.name = v)));
    
    const sel = h('select', { className: 'form-select', onChange: e => r.type = e.target.value });
    ['classroom', 'lab', 'gym', 'hall'].forEach(opt => sel.appendChild(h('option', { value: opt }, opt)));
    sel.value = r.type || 'classroom';
    tr.appendChild(h('td', {}, sel));
    
    const tdSubj = h('td');
    if (!r.subjectIds) r.subjectIds = [];
    
    const container = h('div', { style: { position: 'relative', width: '200px' } });
    const header = h('div', { 
      className: 'form-input', 
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'white', minHeight: '36px', padding: '0 12px' } 
    });
    const headerText = h('span', {}, r.subjectIds.length ? `${r.subjectIds.length} Selected` : 'All Subjects');
    header.appendChild(headerText);
    header.appendChild(h('span', { style: { fontSize: '10px' } }, '▼'));
    container.appendChild(header);
    
    const dropdown = h('div', { 
      className: 'dropdown-menu fade-in custom-multi-dropdown', 
      style: { display: 'none', position: 'absolute', top: '100%', left: '0', right: '0', maxHeight: '200px', overflowY: 'auto', background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', zIndex: '100', boxShadow: 'var(--shadow-md)', marginTop: '4px' } 
    });
    
    store.subjects.forEach(s => {
      const item = h('div', { 
        style: { padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' } 
      });
      const cb = h('input', { type: 'checkbox', style: { cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-cta)' } });
      cb.checked = r.subjectIds.includes(s.id);
      
      const toggleSelection = () => {
        cb.checked = !cb.checked;
        if (cb.checked && !r.subjectIds.includes(s.id)) r.subjectIds.push(s.id);
        else if (!cb.checked) r.subjectIds = r.subjectIds.filter(v => v !== s.id);
        headerText.innerText = r.subjectIds.length ? `${r.subjectIds.length} Selected` : 'All Subjects';
        store.notify();
      };
      
      item.onclick = (e) => { e.stopPropagation(); toggleSelection(); };
      cb.onclick = (e) => { e.stopPropagation(); toggleSelection(); };
      
      item.appendChild(cb);
      item.appendChild(h('span', { style: { fontSize: '0.85rem' } }, s.name));
      dropdown.appendChild(item);
    });
    
    container.appendChild(dropdown);
    
    header.onclick = (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      document.querySelectorAll('.custom-multi-dropdown').forEach(el => el.style.display = 'none');
      dropdown.style.display = isVisible ? 'none' : 'block';
    };
    
    tdSubj.appendChild(container);
    tr.appendChild(tdSubj);
    
    tr.appendChild(h('td', {}, h('button', { className: 'btn btn-ghost btn-icon', onClick: () => { store.rooms.splice(i, 1); store.notify(); } }, svgIcon('trash'))));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  body.appendChild(tbl);
  
  body.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => { store.rooms.push({ id: uid(), name: '', type: 'classroom', subjectIds: [] }); store.notify(); } }, '+ Add Room'));
  
  if (!window.customDropdownInit) {
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-multi-dropdown').forEach(el => el.style.display = 'none');
    });
    window.customDropdownInit = true;
  }
}

function renderRules(body) {
  body.appendChild(h('h3', { className: 'card-title mb-16' }, 'Scheduling Rules'));
  const r = store.rules;
  
  const rulesList = [
    { key: 'noBackToBack', label: 'No back-to-back same subject', desc: 'Prevent a class from having the same subject twice in a row.' },
    { key: 'lunchGap', label: 'Lunch break gap', desc: 'Ensure all teachers and students have a lunch break.' },
    { key: 'spreadSubjects', label: 'Spread subjects across week', desc: 'Avoid scheduling all periods of a subject on consecutive days.' },
    { key: 'teacherPreferences', label: 'Teacher timing preferences', desc: 'Respect individual teacher availability.' },
    { key: 'labDoublePeriods', label: 'Lab subjects get double periods', desc: 'Automatically schedule 2 consecutive periods for labs.' }
  ];
  
  rulesList.forEach(rule => {
    const row = h('div', { className: 'flex justify-between items-center mb-16 py-8 border-bottom', style: { borderBottom: '1px solid var(--border-color)' } });
    const txt = h('div', {});
    txt.appendChild(h('div', { className: 'font-semibold' }, rule.label));
    txt.appendChild(h('div', { className: 'text-muted text-sm' }, rule.desc));
    row.appendChild(txt);
    row.appendChild(toggleSwitch(r[rule.key], v => { r[rule.key] = v; store.notify(); }));
    body.appendChild(row);
  });
}

function fg(label, inp) { return h('div', { className: 'form-group' }, h('label', { className: 'form-label' }, label), inp); }
function inp(val, onChange, type = 'text') { return h('input', { type, className: 'form-input', value: val, onInput: e => onChange(e.target.value) }); }

function startGeneration(page) {
  const overlay = h('div', { className: 'loading-overlay active' });
  const spinner = h('div', { className: 'spinner' });
  const text = h('div', { className: 'loading-text' }, 'Parsing configuration...');
  overlay.appendChild(spinner);
  overlay.appendChild(text);
  document.body.appendChild(overlay);

  const messages = ['Placing shared group sessions...', 'Scheduling core subjects...', 'Running conflict resolution...', 'Optimizing resources...'];
  let step = 0;
  const interval = setInterval(() => {
    if (step < messages.length) text.innerText = messages[step++];
    else {
      clearInterval(interval);
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      triggerConfetti();
      
      // Actual generation
      import('../engine/scheduler.js').then(m => {
        m.generateTimetable();
        store.currentView = 'dashboard';
        store.addLog('Initial timetable generated successfully.');
        store.notify();
      });
    }
  }, 600);
}

function triggerConfetti() {
  for (let i = 0; i < 50; i++) {
    const conf = h('div', { className: 'confetti' });
    conf.style.left = Math.random() * 100 + 'vw';
    conf.style.backgroundColor = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'][Math.floor(Math.random() * 6)];
    conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 3000);
  }
}
