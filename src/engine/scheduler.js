import { store, uid } from '../data/store.js';

export function generateTimetable() {
  const { school, subjects, teachers, rooms, grades } = store;
  const classes = store.getAllClasses();
  const days = school.days;
  const periods = Array.from({ length: Math.ceil(school.periodDuration * 8 / 60) }, (_, i) => i); // Approximation: 8 periods max
  
  const tt = {};
  classes.forEach(c => {
    tt[c.classId] = {};
    days.forEach(d => { tt[c.classId][d] = {}; });
  });

  const teacherUsed = {}; // teacherUsed[teacherId][day][period]
  teachers.forEach(t => { teacherUsed[t.id] = {}; days.forEach(d => teacherUsed[t.id][d] = new Set()); });

  const roomUsed = {}; // roomUsed[roomId][day][period]
  rooms.forEach(r => { roomUsed[r.id] = {}; days.forEach(d => roomUsed[r.id][d] = new Set()); });

  function isSlotFree(classId, day, period) { return !tt[classId][day][period]; }
  function isTeacherFree(tId, day, period) { return !teacherUsed[tId][day].has(period); }
  function isRoomFree(rId, day, period) { return !roomUsed[rId][day].has(period); }

  // 1. Place Shared Subjects (once per grade)
  const sharedSubjects = subjects.filter(s => s.isShared);
  
  sharedSubjects.forEach(subj => {
    const eligibleTeachers = teachers.filter(t => t.subjectId === subj.id);
    if (!eligibleTeachers.length) return;
    
    // Auto-route to mapped rooms or general rooms
    const eligibleRooms = rooms.filter(r => (!r.subjectIds || r.subjectIds.length === 0) || r.subjectIds.includes(subj.id));

    grades.forEach(g => {
      let assigned = 0;
      const classIds = g.sections.map(s => `${g.id}-${s}`);
      
      for (const day of days) {
        if (assigned >= subj.periodsPerWeek) break;
        for (const period of periods) {
          if (assigned >= subj.periodsPerWeek) break;
          
          const allFree = classIds.every(cId => isSlotFree(cId, day, period));
          if (!allFree) continue;

          const teacher = eligibleTeachers.find(t => isTeacherFree(t.id, day, period));
          if (!teacher) continue;
          
          const room = eligibleRooms.find(r => r.subjectIds?.includes(subj.id) && isRoomFree(r.id, day, period)) ||
                       eligibleRooms.find(r => (!r.subjectIds || r.subjectIds.length === 0) && r.type === 'gym' && isRoomFree(r.id, day, period)) ||
                       eligibleRooms.find(r => (!r.subjectIds || r.subjectIds.length === 0) && isRoomFree(r.id, day, period)) || null;

          const sessionId = uid();
          classIds.forEach(cId => {
            tt[cId][day][period] = {
              id: sessionId,
              subjectId: subj.id,
              teacherId: teacher.id,
              roomId: room?.id,
              isShared: true,
              sharedWith: classIds.filter(id => id !== cId)
            };
          });
          
          teacherUsed[teacher.id][day].add(period);
          if (room) roomUsed[room.id][day].add(period);
          assigned++;
          break; // move to next day to spread shared subjects
        }
      }
    });
  });

  // 2. Place Regular Subjects
  const regularSubjects = subjects.filter(s => !s.isShared);
  
  classes.forEach(c => {
    regularSubjects.forEach(subj => {
      let assigned = 0;
      const eligibleTeachers = teachers.filter(t => t.subjectId === subj.id);
      if (!eligibleTeachers.length) return;

      for (const day of days) {
        if (assigned >= subj.periodsPerWeek) break;
        for (const period of periods) {
          if (assigned >= subj.periodsPerWeek) break;
          
          if (!isSlotFree(c.classId, day, period)) continue;
          
          const teacher = eligibleTeachers.find(t => isTeacherFree(t.id, day, period));
          if (!teacher) continue;
          
          let room = rooms.find(r => r.subjectIds?.includes(subj.id) && isRoomFree(r.id, day, period));
          if (!room) room = rooms.find(r => (!r.subjectIds || r.subjectIds.length === 0) && r.type === 'classroom' && isRoomFree(r.id, day, period));
          if (!room) room = rooms.find(r => (!r.subjectIds || r.subjectIds.length === 0) && isRoomFree(r.id, day, period));

          tt[c.classId][day][period] = {
            id: uid(),
            subjectId: subj.id,
            teacherId: teacher.id,
            roomId: room ? room.id : null,
            isShared: false
          };
          
          teacherUsed[teacher.id][day].add(period);
          if (room) roomUsed[room.id][day].add(period);
          assigned++;
          break; // move to next day for spreading subjects (simplistic)
        }
      }
    });
  });

  store.timetable = tt;
  store.save?.(); // if persisting
  return tt;
}
