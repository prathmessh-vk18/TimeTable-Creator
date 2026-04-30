import { store, uid } from '../data/store.js';
import { h, toggleSwitch, svgIcon } from '../utils/helpers.js';
import { detectConflicts, calculateDashboardMetrics, getTeacherUtilizationData, getRoomUtilizationData } from '../engine/conflicts.js';

export function renderDashboard(container) {
  container.innerHTML = '';
  const page = h('div', { className: 'fade-in' });

  // Top Bar
  const header = h('div', { className: 'dash-header' });
  const hLeft = h('div', {});
  hLeft.appendChild(h('h2', { className: 'dash-title' }, store.school.name));
  const classes = store.getAllClasses();
  hLeft.appendChild(h('div', { className: 'text-muted text-sm' }, `${store.grades.length} Grades · ${classes.length} Sections`));
  header.appendChild(hLeft);
  
  const hRight = h('div', { className: 'flex gap-8' });
  hRight.appendChild(h('button', { className: 'btn btn-outline', onClick: () => { store.currentView = 'setup'; store.notify(); } }, 'Edit setup'));
  hRight.appendChild(h('button', { className: 'btn btn-primary', onClick: () => {
    const overlay = h('div', { className: 'loader-overlay' });
    const container = h('div', { className: 'loader-container' });
    container.appendChild(h('div', { className: 'loader-text' }, 'Optimising Schedule...'));
    const fill = h('div', { className: 'loader-fill' });
    container.appendChild(h('div', { className: 'loader-bar' }, fill));
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    setTimeout(() => { fill.style.width = '100%'; }, 10);

    setTimeout(() => {
      import('../engine/scheduler.js').then(m => {
        m.generateTimetable();
        detectConflicts();
        store.addLog('Timetable re-solved automatically.');
        overlay.remove();
        store.notify();
      });
    }, 2000);
  } }, 'Re-solve ', svgIcon('refresh')));
  header.appendChild(hRight);
  page.appendChild(header);

  // Layout Grid
  const layout = h('div', { className: 'dash-layout' });

  // Left Column (Grid)
  const mainCol = h('div', { className: 'dash-main' });
  
  // Metrics Row
  const metrics = calculateDashboardMetrics();
  const mGrid = h('div', { className: 'metrics-grid' });
  mGrid.appendChild(metricCard('Slot Fill Rate', `${metrics.fillRate}%`, 'var(--primary-text)'));
  mGrid.appendChild(metricCard('Shared Subjects', metrics.sharedCount, 'var(--c-amber-txt)'));
  mGrid.appendChild(metricCard('Conflicts', store.conflicts.length, store.conflicts.length > 0 ? 'var(--c-red-txt)' : 'var(--c-green-txt)'));
  mainCol.appendChild(mGrid);

  // Tabs for Grades & Sections
  if (!store.dashboardGrade && store.grades.length) store.dashboardGrade = store.grades[0].id;
  
  const gradeTabs = h('div', { className: 'tt-tabs' });
  store.grades.forEach(g => {
    gradeTabs.appendChild(h('div', { 
      className: `tt-tab ${store.dashboardGrade === g.id ? 'active' : ''}`,
      onClick: () => { store.dashboardGrade = g.id; store.dashboardSection = null; store.notify(); }
    }, g.name));
  });
  mainCol.appendChild(gradeTabs);

  const curGrade = store.grades.find(g => g.id === store.dashboardGrade);
  if (curGrade) {
    if (!store.dashboardSection && curGrade.sections.length) store.dashboardSection = curGrade.sections[0];
    const secTabs = h('div', { className: 'tt-tabs', style: { marginBottom: '24px', border: 'none' } });
    curGrade.sections.forEach(s => {
      secTabs.appendChild(h('div', { 
        className: `chip-sec ${store.dashboardSection === s ? 'active' : ''}`, 
        style: store.dashboardSection === s ? { background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary-text)', cursor: 'pointer' } : { cursor: 'pointer' },
        onClick: () => { store.dashboardSection = s; store.notify(); }
      }, `Section ${s}`));
    });
    mainCol.appendChild(secTabs);

    // Timetable Grid
    const classId = `${curGrade.id}-${store.dashboardSection}`;
    renderTimetableGrid(mainCol, classId);
  }

  layout.appendChild(mainCol);

  // Right Column (Bars & Logs)
  const sideCol = h('div', { className: 'dash-sidebar' });
  
  // Teacher Util
  sideCol.appendChild(h('h4', { className: 'font-semibold mb-16' }, 'Teacher Utilisation'));
  getTeacherUtilizationData().forEach(t => {
    const colClass = t.pct > 90 ? 'u-red' : t.pct > 70 ? 'u-amber' : 'u-green';
    sideCol.appendChild(utilBar(t.name, `${t.periods} / week`, t.pct, colClass));
  });

  // Room Util
  sideCol.appendChild(h('h4', { className: 'font-semibold mb-16 mt-24' }, 'Room Utilisation'));
  getRoomUtilizationData().forEach(r => {
    sideCol.appendChild(heatmapBar(r.name, r.dailyUsage, r.context));
  });

  // Conflicts Box
  sideCol.appendChild(h('h4', { className: 'font-semibold mb-16 mt-24' }, 'Conflicts & Alerts'));
  if (store.conflicts.length === 0) {
    sideCol.appendChild(h('div', { className: 'text-sm mb-16 flex items-center gap-8', style: { color: 'var(--c-green-txt)' } }, svgIcon('check'), ' No conflicts detected.'));
  } else {
    store.conflicts.forEach(c => {
      sideCol.appendChild(h('div', { className: 'text-sm mb-8 p-8 border flex items-center gap-8', style: { background: 'var(--c-red-bg)', color: 'var(--c-red-txt)', borderColor: '#fecaca', borderRadius: '4px' } }, svgIcon('alertTriangle'), ` ${c.message}`));
    });
  }

  // Console Log
  sideCol.appendChild(h('h4', { className: 'font-semibold mb-16 mt-24' }, 'Activity Log'));
  const logBox = h('div', { className: 'console-log' });
  store.logs.forEach(l => {
    logBox.appendChild(h('div', { className: 'log-entry' }, 
      h('span', { className: 'log-time' }, `[${l.time}]`),
      h('span', { className: 'log-msg' }, l.msg)
    ));
  });
  sideCol.appendChild(logBox);

  layout.appendChild(sideCol);
  page.appendChild(layout);
  container.appendChild(page);

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.util-bar-fill').forEach(b => {
      b.style.width = b.dataset.width;
    });
  }, 100);
}

function metricCard(label, val, color) {
  return h('div', { className: 'metric-card' },
    h('div', { className: 'metric-val', style: { color } }, String(val)),
    h('div', { className: 'metric-lbl' }, label)
  );
}

function heatmapBar(name, dailyUsage, subtext) {
  const row = h('div', { className: 'util-row', style: { marginBottom: '16px' } });
  const lbls = h('div', { className: 'util-labels', style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } });
  lbls.appendChild(h('span', { className: 'font-semibold' }, name));
  row.appendChild(lbls);
  
  const blocks = h('div', { style: { display: 'flex', gap: '4px', width: '100%' } });
  const daysLabels = store.school.days.map(d => d.slice(0, 3));
  
  dailyUsage.forEach((usage, i) => {
    let opacity = 0.05;
    if (usage > 0) opacity = Math.max(0.2, usage);
    
    const block = h('div', { 
      style: { 
        flex: 1, 
        height: '24px', 
        background: `rgba(37, 99, 235, ${opacity})`, 
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.65rem',
        color: usage > 0.6 ? '#fff' : 'rgba(37, 99, 235, 0.8)',
        fontWeight: 'bold'
      } 
    }, daysLabels[i]);
    blocks.appendChild(block);
  });
  
  row.appendChild(blocks);
  
  if (subtext) {
     row.appendChild(h('div', { className: 'text-muted mt-4', style: { fontSize: '0.65rem' } }, subtext));
  }
  return row;
}

function utilBar(name, valLbl, pct, fillClass, subtext = null) {
  const row = h('div', { className: 'util-row' });
  const lbls = h('div', { className: 'util-labels' });
  lbls.appendChild(h('span', {}, name));
  lbls.appendChild(h('span', {}, valLbl));
  row.appendChild(lbls);
  
  const bg = h('div', { className: 'util-bar-bg' });
  const fill = h('div', { className: `util-bar-fill ${fillClass}`, dataset: { width: `${pct}%` } });
  bg.appendChild(fill);
  row.appendChild(bg);
  
  if (subtext) {
     row.appendChild(h('div', { className: 'text-muted mt-4', style: { fontSize: '0.65rem' } }, subtext));
  }
  return row;
}

function renderTimetableGrid(container, classId) {
  const { days, periodDuration } = store.school;
  const periods = Array.from({ length: Math.ceil(periodDuration * 8 / 60) }, (_, i) => i);
  const tt = store.timetable[classId] || {};

  const grid = h('div', { className: 'tt-grid', style: { gridTemplateColumns: `80px repeat(${days.length}, 1fr)` } });
  
  grid.appendChild(h('div', { className: 'tt-hdr' }, 'Time'));
  days.forEach(d => grid.appendChild(h('div', { className: 'tt-hdr' }, d)));

  periods.forEach(p => {
    // Basic time math
    let extraMins = 0;
    if (p >= store.school.breakAfter) extraMins = 30; // 30 min break
    
    const startHour = parseInt(store.school.startTime.split(':')[0]) + Math.floor((p * periodDuration + extraMins) / 60);
    const startMin = parseInt(store.school.startTime.split(':')[1]) + ((p * periodDuration + extraMins) % 60);
    const timeStr = `${String(startHour + Math.floor(startMin/60)).padStart(2,'0')}:${String(startMin%60).padStart(2,'0')}`;

    grid.appendChild(h('div', { className: 'tt-hdr', style: { display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, 
      h('span', {}, `P${p+1}`),
      h('span', { className: 'text-muted', style: { fontSize: '0.7rem', fontWeight: '400' } }, timeStr)
    ));

    days.forEach(d => {
      const cell = h('div', { className: 'tt-cell' });
      const sess = tt[d]?.[p];
      
      if (sess) {
        const subj = store.getSubject(sess.subjectId);
        const tchr = store.getTeacher(sess.teacherId);
        const room = store.getRoom(sess.roomId);
        
        const card = h('div', { 
          className: 'period-card', 
          style: { background: `var(--c-${subj.color}-bg)`, color: `var(--c-${subj.color}-txt)`, cursor: 'pointer' },
          onClick: (e) => showEditDropdown(e, classId, d, p, sess)
        });
        card.appendChild(h('div', { className: 'pc-subject' }, subj.name));
        card.appendChild(h('div', { className: 'pc-teacher' }, tchr?.name || 'No teacher'));
        
        if (room) {
          card.appendChild(h('div', { className: 'pc-room', style: { fontSize: '0.75rem', opacity: '0.8', marginTop: '2px' } }, room.name));
        }
        
        if (sess.isShared) {
          const others = sess.sharedWith.map(id => id.split('-')[1]).join(', ');
          card.appendChild(h('div', { className: 'pc-shared' }, `Shared w/ ${others}`));
        }
        
        cell.appendChild(card);
      } else {
        const empty = h('div', { className: 'tt-cell-empty' });
        empty.onclick = (e) => showAssignmentDropdown(e, classId, d, p);
        cell.appendChild(empty);
      }
      grid.appendChild(cell);
    });

    if (p === store.school.breakAfter - 1) {
      grid.appendChild(h('div', { 
        className: 'tt-hdr', 
        style: { gridColumn: `1 / span ${days.length + 1}`, background: 'var(--c-amber-bg)', color: 'var(--c-amber-txt)', textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold', padding: '12px 0', borderBottom: '1px solid var(--border-color)', borderRight: 'none' }
      }, 'B R E A K'));
    }
  });

  container.appendChild(grid);
}

function showAssignmentDropdown(eOrRect, classId, day, period, sessionToReplace = null) {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.remove());
  
  const menu = h('div', { className: 'dropdown-menu fade-in' });
  const rect = eOrRect.target ? eOrRect.target.getBoundingClientRect() : eOrRect;
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;

  menu.appendChild(h('div', { className: 'p-8 border-bottom text-xs text-muted font-semibold uppercase', style: { padding: '8px', borderBottom: '1px solid var(--border-color)' } }, 'Assign Subject'));

  store.subjects.forEach(subj => {
    // Check if there's an available teacher for this subject in this period
    const eligibleTeachers = store.teachers.filter(t => t.subjectId === subj.id);
    let availableTeacher = null;
    let conflictDetails = null;
    
    // Check teacher availability
    for (const t of eligibleTeachers) {
      let isBusy = false;
      let busyWith = null;
      store.getAllClasses().forEach(c => {
        const sess = store.timetable[c.classId]?.[day]?.[period];
        if (sess && sess.teacherId === t.id) {
          if (sessionToReplace && sess.id === sessionToReplace.id) return; // ignore the one we are replacing
          isBusy = true;
          const room = store.getRoom(sess.roomId);
          const roomName = room ? room.name : (sess.roomId ? 'Unknown Room' : 'No Room');
          busyWith = `${c.gradeName}-${c.section} in ${roomName}`;
        }
      });
      if (!isBusy) { 
        availableTeacher = t; 
        break; 
      } else {
        if (!conflictDetails) conflictDetails = busyWith;
      }
    }

    const item = h('div', { className: 'dd-item', style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' } });
    const topRow = h('div', { className: 'w-full flex justify-between items-center' });
    topRow.appendChild(h('span', {}, subj.name));
    
    if (availableTeacher) {
      topRow.appendChild(h('span', { className: 'dd-status dd-free' }, 'Free'));
      item.onclick = () => {
        if (sessionToReplace) {
          // manually delete the old one without notify
          if (sessionToReplace.isShared) {
             const cIds = [classId, ...(sessionToReplace.sharedWith || [])];
             cIds.forEach(cid => { if (store.timetable[cid]?.[day]) delete store.timetable[cid][day][period]; });
          } else {
             delete store.timetable[classId][day][period];
          }
        }
        
        if (!store.timetable[classId][day]) store.timetable[classId][day] = {};
        
        let freeRoom = store.rooms.find(r => {
          let rBusy = false;
          store.getAllClasses().forEach(c2 => {
            if (store.timetable[c2.classId]?.[day]?.[period]?.roomId === r.id) {
              if (sessionToReplace && store.timetable[c2.classId]?.[day]?.[period]?.id === sessionToReplace.id) return;
              rBusy = true;
            }
          });
          return !rBusy && r.type === 'classroom';
        });
        if (!freeRoom) freeRoom = store.rooms.find(r => r.type === 'classroom') || store.rooms[0];

        store.timetable[classId][day][period] = {
          id: uid(), subjectId: subj.id, teacherId: availableTeacher.id, roomId: freeRoom ? freeRoom.id : null, isShared: false
        };
        store.addLog(`${sessionToReplace ? 'Replaced with' : 'Manually assigned'} ${subj.name} to ${classId} on ${day} P${period+1}`);
        detectConflicts();
        store.notify();
      };
      item.appendChild(topRow);
    } else {
      topRow.appendChild(h('span', { className: 'dd-status dd-busy' }, 'Taken'));
      item.appendChild(topRow);
      item.appendChild(h('span', { className: 'text-muted text-sm', style: { fontSize: '0.7rem' } }, `Busy with ${conflictDetails || 'another class'}`));
      item.style.cursor = 'not-allowed';
      item.style.opacity = '0.8';
    }
    menu.appendChild(item);
  });

  document.body.appendChild(menu);
  
  // Close when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

function deleteSession(classId, day, period) {
  const sess = store.timetable[classId]?.[day]?.[period];
  if (!sess) return;
  const subjName = store.getSubject(sess.subjectId)?.name || 'Subject';
  
  if (sess.isShared) {
    const classIds = [classId, ...(sess.sharedWith || [])];
    classIds.forEach(cid => {
      if (store.timetable[cid] && store.timetable[cid][day]) {
        delete store.timetable[cid][day][period];
      }
    });
    store.addLog(`Deleted shared session ${subjName} on ${day} P${period+1}`);
  } else {
    delete store.timetable[classId][day][period];
    store.addLog(`Deleted session ${subjName} on ${day} P${period+1}`);
  }
  detectConflicts();
  store.notify();
}

function showEditDropdown(e, classId, day, period, sess) {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.remove());
  
  const menu = h('div', { className: 'dropdown-menu fade-in', style: { minWidth: '160px' } });
  const rect = e.currentTarget.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;

  const repBtn = h('div', { className: 'dd-item', style: { display: 'flex', alignItems: 'center', gap: '6px' } }, svgIcon('refresh'), 'Replace Subject');
  repBtn.onclick = (ev) => {
    ev.stopPropagation(); // prevent immediate close by bubbled event
    ev.preventDefault();
    menu.remove();
    setTimeout(() => {
      showAssignmentDropdown(rect, classId, day, period, sess);
    }, 10);
  };

  const delBtn = h('div', { className: 'dd-item', style: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--c-red-txt)' } }, svgIcon('trash'), 'Delete Session');
  delBtn.onclick = () => { deleteSession(classId, day, period); };

  menu.appendChild(repBtn);
  menu.appendChild(delBtn);
  document.body.appendChild(menu);
  
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}
