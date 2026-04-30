// Central state management
export const store = {
  school: {
    name: 'My School',
    startTime: '08:30',
    endTime: '15:30',
    periodDuration: 50,
    breakAfter: 4,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  grades: [
    { id: 'g1', name: 'Grade 6', sections: ['A', 'B'] },
    { id: 'g2', name: 'Grade 7', sections: ['A', 'B'] },
    { id: 'g3', name: 'Grade 8', sections: ['A', 'B'] },
    { id: 'g4', name: 'Grade 9', sections: ['A', 'B'] },
    { id: 'g5', name: 'Grade 10', sections: ['A', 'B'] }
  ],
  subjects: [
    { id: 's1', name: 'Mathematics', periodsPerWeek: 5, color: 'blue', isShared: false },
    { id: 's2', name: 'Science', periodsPerWeek: 4, color: 'green', isShared: false },
    { id: 's3', name: 'English', periodsPerWeek: 4, color: 'purple', isShared: false },
    { id: 's4', name: 'Hindi', periodsPerWeek: 3, color: 'pink', isShared: false },
    { id: 's5', name: 'Social Studies', periodsPerWeek: 4, color: 'amber', isShared: false },
    { id: 's6', name: 'Computer Science', periodsPerWeek: 2, color: 'teal', isShared: false },
    { id: 's7', name: 'Physical Education', periodsPerWeek: 2, color: 'coral', isShared: true }
  ],
  teachers: [
    { id: 't1', name: 'Rajesh Kumar', subjectId: 's1' },
    { id: 't2', name: 'Priya Sharma', subjectId: 's2' },
    { id: 't3', name: 'Amit Patel', subjectId: 's3' },
    { id: 't4', name: 'Sneha Iyer', subjectId: 's4' },
    { id: 't5', name: 'Vikram Singh', subjectId: 's5' },
    { id: 't6', name: 'Anjali Desai', subjectId: 's6' },
    { id: 't7', name: 'Rohan Gupta', subjectId: 's7' },
    { id: 't8', name: 'Neha Reddy', subjectId: 's1' },
    { id: 't9', name: 'Kabir Das', subjectId: 's2' },
    { id: 't10', name: 'Pooja Verma', subjectId: 's3' }
  ],
  rooms: [
    { id: 'r1', name: 'Room 101', type: 'classroom', subjectIds: [] },
    { id: 'r2', name: 'Room 102', type: 'classroom', subjectIds: [] },
    { id: 'r3', name: 'Room 103', type: 'classroom', subjectIds: [] },
    { id: 'r4', name: 'Room 104', type: 'classroom', subjectIds: [] },
    { id: 'r5', name: 'Physics Lab', type: 'lab', subjectIds: ['s2'] },
    { id: 'r6', name: 'Chemistry Lab', type: 'lab', subjectIds: ['s2'] },
    { id: 'r7', name: 'Computer Lab', type: 'lab', subjectIds: ['s6'] },
    { id: 'r8', name: 'Main Ground', type: 'gym', subjectIds: ['s7'] }
  ],
  rules: {
    noBackToBack: true,
    lunchGap: true,
    spreadSubjects: true,
    teacherPreferences: false,
    labDoublePeriods: false
  },
  timetable: {},
  conflicts: [],
  logs: [],
  
  currentView: 'setup',
  isOptimizing: false,
  setupStep: 1,
  dashboardGrade: null,
  dashboardSection: null,

  listeners: [],
  subscribe(fn) { this.listeners.push(fn); },
  notify() { this.listeners.forEach(fn => fn()); },

  addLog(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.unshift({ time, msg });
    if (this.logs.length > 50) this.logs.pop();
    this.notify();
  },

  getAllClasses() {
    const classes = [];
    this.grades.forEach(g => {
      g.sections.forEach(s => {
        classes.push({ gradeId: g.id, gradeName: g.name, section: s, classId: `${g.id}-${s}` });
      });
    });
    return classes;
  },

  getSubject(id) { return this.subjects.find(s => s.id === id); },
  getTeacher(id) { return this.teachers.find(t => t.id === id); },
  getRoom(id) { return this.rooms.find(r => r.id === id); }
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
