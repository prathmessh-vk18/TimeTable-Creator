// Optimization layer for generated timetables
import { store } from '../data/store.js';

export function optimizeTimetable() {
  const tt = store.timetable;
  const { days } = store.school;
  const periods = Array.from({ length: store.school.periodsPerDay }, (_, i) => i);
  let improvements = 0;

  // Pass 1: Reduce teacher idle gaps
  store.teachers.forEach(teacher => {
    days.forEach(day => {
      const slots = getTeacherSlots(teacher.id, day);
      if (slots.length < 2) return;
      const min = Math.min(...slots);
      const max = Math.max(...slots);
      const gaps = (max - min + 1) - slots.length;
      if (gaps > 0) {
        // Try to compact by swapping sessions toward center
        improvements += tryCompactTeacher(teacher.id, day, tt, periods);
      }
    });
  });

  // Pass 2: Balance subject distribution
  store.getClasses().forEach(cls => {
    store.subjects.forEach(subj => {
      const dist = getSubjectDayDistribution(cls.id, subj.id);
      const daysWithMultiple = Object.values(dist).filter(c => c > 1);
      if (daysWithMultiple.length > 0) {
        improvements += trySpreadSubject(cls.id, subj.id, tt, days, periods);
      }
    });
  });

  if (improvements > 0) store.save();
  return improvements;
}

function getTeacherSlots(teacherId, day) {
  const tt = store.timetable;
  const slots = [];
  store.getClasses().forEach(cls => {
    const dayData = tt[cls.id]?.[day] || {};
    Object.entries(dayData).forEach(([p, session]) => {
      if (session?.teacherId === teacherId) slots.push(parseInt(p));
    });
  });
  return [...new Set(slots)].sort((a, b) => a - b);
}

function getSubjectDayDistribution(classId, subjectId) {
  const tt = store.timetable;
  const dist = {};
  store.school.days.forEach(d => {
    dist[d] = 0;
    const dayData = tt[classId]?.[d] || {};
    Object.values(dayData).forEach(session => {
      if (session?.subjectId === subjectId) dist[d]++;
    });
  });
  return dist;
}

function tryCompactTeacher(teacherId, day, tt, periods) {
  // Simple: try swapping idle-gap sessions with adjacent free ones
  return 0; // Placeholder — complex swap logic
}

function trySpreadSubject(classId, subjectId, tt, days, periods) {
  return 0; // Placeholder — complex redistribution
}

// Analytics functions
export function getTeacherUtilization(teacherId) {
  const teacher = store.getTeacherById(teacherId);
  if (!teacher) return { total: 0, used: 0, pct: 0, idle: 0 };
  const { days } = store.school;
  let totalAvail = 0;
  let used = 0;
  days.forEach(d => {
    const avail = teacher.availability[d]?.length || 0;
    totalAvail += avail;
    const slots = getTeacherSlots(teacherId, d);
    used += slots.length;
  });
  const idle = totalAvail - used;
  return { total: totalAvail, used, pct: totalAvail > 0 ? Math.round(used / totalAvail * 100) : 0, idle };
}

export function getResourceUtilization(resourceId) {
  const tt = store.timetable;
  const { days } = store.school;
  const totalSlots = days.length * store.school.periodsPerDay;
  let used = 0;
  store.getClasses().forEach(cls => {
    days.forEach(d => {
      const dayData = tt[cls.id]?.[d] || {};
      Object.values(dayData).forEach(session => {
        if (session?.resourceId === resourceId) used++;
      });
    });
  });
  // Dedupe grouped sessions
  return { total: totalSlots, used: Math.min(used, totalSlots), pct: Math.round(Math.min(used, totalSlots) / totalSlots * 100) };
}

export function getClassCompleteness(classId) {
  const tt = store.timetable;
  if (!tt[classId]) return { filled: 0, total: 0, pct: 0 };
  const { days } = store.school;
  const total = days.length * store.school.periodsPerDay;
  let filled = 0;
  days.forEach(d => {
    filled += Object.keys(tt[classId]?.[d] || {}).length;
  });
  return { filled, total, pct: Math.round(filled / total * 100) };
}
