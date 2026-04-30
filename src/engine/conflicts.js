import { store } from '../data/store.js';

export function detectConflicts() {
  const tt = store.timetable;
  const { days } = store.school;
  const conflicts = [];
  const classes = store.getAllClasses();
  
  // Track periods per class per day and back-to-back subjects
  classes.forEach(c => {
    days.forEach(d => {
      const daySessions = tt[c.classId]?.[d] || {};
      const periodKeys = Object.keys(daySessions).map(Number).sort((a,b)=>a-b);
      
      if (periodKeys.length > 8) {
        conflicts.push({ severity: 'warning', type: 'overload', message: `${c.gradeName}-${c.section} has ${periodKeys.length} periods on ${d} (>8).` });
      }

      if (store.rules.noBackToBack) {
        for (let i = 0; i < periodKeys.length - 1; i++) {
          const p1 = periodKeys[i];
          const p2 = periodKeys[i+1];
          // Check if they are consecutive periods
          if (p2 === p1 + 1) {
            const subj1 = daySessions[p1].subjectId;
            const subj2 = daySessions[p2].subjectId;
            if (subj1 === subj2 && subj1) {
              const subj = store.getSubject(subj1);
              conflicts.push({ severity: 'error', type: 'rule', message: `${c.gradeName}-${c.section} has back-to-back ${subj?.name || 'subject'} on ${d} P${p1+1}&P${p2+1}.` });
            }
          }
        }
      }
    });
  });

  // Calculate teacher utilization (over 90% is a conflict)
  const totalSlots = days.length * 8; // approx max periods
  store.teachers.forEach(t => {
    let used = 0;
    const seenSessions = new Set();
    classes.forEach(c => {
      days.forEach(d => {
        Object.values(tt[c.classId]?.[d] || {}).forEach(sess => {
          if (sess.teacherId === t.id) {
            if (!seenSessions.has(sess.id)) {
              seenSessions.add(sess.id);
              used++;
            }
          }
        });
      });
    });
    
    const pct = (used / totalSlots) * 100;
    if (pct > 90) {
      conflicts.push({ severity: 'error', type: 'teacher', message: `${t.name} is overloaded (${Math.round(pct)}% utilization).` });
    }
  });

  store.conflicts = conflicts;
  return conflicts;
}

export function calculateDashboardMetrics() {
  const tt = store.timetable;
  const classes = store.getAllClasses();
  const days = store.school.days;
  
  let filledSlots = 0;
  let totalPossibleSlots = classes.length * days.length * 8; // approx
  
  let sharedSubjectsCount = 0;
  let weeklySavings = 0; // ₹500 per merged session
  
  const uniqueSharedSessions = new Set();

  classes.forEach(c => {
    days.forEach(d => {
      Object.values(tt[c.classId]?.[d] || {}).forEach(sess => {
        filledSlots++;
        if (sess.isShared) {
          if (!uniqueSharedSessions.has(sess.id)) {
            uniqueSharedSessions.add(sess.id);
            // If shared with N other classes, we saved N sessions
            weeklySavings += (sess.sharedWith.length * 500);
          }
        }
      });
    });
  });
  
  sharedSubjectsCount = store.subjects.filter(s => s.isShared).length;

  return {
    fillRate: Math.round((filledSlots / totalPossibleSlots) * 100) || 0,
    sharedCount: sharedSubjectsCount,
    savings: weeklySavings
  };
}

export function getTeacherUtilizationData() {
  const tt = store.timetable;
  const classes = store.getAllClasses();
  const days = store.school.days;
  const totalSlots = days.length * 8;
  
  return store.teachers.map(t => {
    let used = 0;
    const seen = new Set();
    classes.forEach(c => {
      days.forEach(d => {
        Object.values(tt[c.classId]?.[d] || {}).forEach(sess => {
          if (sess.teacherId === t.id && !seen.has(sess.id)) {
            seen.add(sess.id); used++;
          }
        });
      });
    });
    return { id: t.id, name: t.name, pct: Math.round((used / totalSlots) * 100) || 0, periods: used };
  });
}

export function getRoomUtilizationData() {
  const tt = store.timetable;
  const classes = store.getAllClasses();
  const days = store.school.days;
  const periodsPerDay = Math.ceil(store.school.periodDuration * 8 / 60);
  
  return store.rooms.map(r => {
    const seen = new Set();
    const subjs = new Set();
    
    const dailyUsage = days.map(d => {
      let dayUsed = 0;
      classes.forEach(c => {
        Object.values(tt[c.classId]?.[d] || {}).forEach(sess => {
          if (sess.roomId === r.id && !seen.has(sess.id)) {
            seen.add(sess.id); dayUsed++;
            const subjName = store.getSubject(sess.subjectId)?.name;
            if (subjName) subjs.add(subjName);
          }
        });
      });
      return dayUsed / periodsPerDay;
    });
    
    let context = '';
    if (subjs.size > 0) {
      context = `Uses: ${Array.from(subjs).slice(0, 2).join(', ')}${subjs.size > 2 ? '...' : ''}`;
    } else {
      context = r.subjectIds && r.subjectIds.length ? 'Mapped (Unused)' : 'Unused';
    }
    
    return { id: r.id, name: r.name, dailyUsage, context };
  });
}
