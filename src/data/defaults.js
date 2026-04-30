// Default/mock data for ChronoClass
export function loadDefaults(store) {
  store.school = {
    name: 'Springfield Academy',
    periodsPerDay: 8,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodTimes: [
      { label: 'Period 1', start: '08:00', end: '08:45' },
      { label: 'Period 2', start: '08:50', end: '09:35' },
      { label: 'Period 3', start: '09:40', end: '10:25' },
      { label: 'Period 4', start: '10:40', end: '11:25' },
      { label: 'Period 5', start: '11:30', end: '12:15' },
      { label: 'Period 6', start: '13:00', end: '13:45' },
      { label: 'Period 7', start: '13:50', end: '14:35' },
      { label: 'Period 8', start: '14:40', end: '15:25' }
    ],
    grades: [
      { name: 'Grade 5', sections: ['A', 'B'] },
      { name: 'Grade 6', sections: ['A', 'B'] },
      { name: 'Grade 7', sections: ['A', 'B', 'C'] },
    ]
  };

  store.subjects = [
    { id: 'math', name: 'Mathematics', type: 'theory', periodsPerWeek: 6, color: 'math', requiresResource: null },
    { id: 'science', name: 'Science', type: 'theory', periodsPerWeek: 5, color: 'science', requiresResource: null },
    { id: 'english', name: 'English', type: 'theory', periodsPerWeek: 6, color: 'english', requiresResource: null },
    { id: 'history', name: 'History', type: 'theory', periodsPerWeek: 3, color: 'history', requiresResource: null },
    { id: 'geography', name: 'Geography', type: 'theory', periodsPerWeek: 3, color: 'geography', requiresResource: null },
    { id: 'art', name: 'Art', type: 'theory', periodsPerWeek: 2, color: 'art', requiresResource: null },
    { id: 'music', name: 'Music', type: 'theory', periodsPerWeek: 2, color: 'music', requiresResource: null },
    { id: 'pe', name: 'Physical Education', type: 'sports', periodsPerWeek: 3, color: 'pe', requiresResource: 'ground' },
    { id: 'computer', name: 'Computer Science', type: 'lab', periodsPerWeek: 2, color: 'computer', requiresResource: 'comp-lab' },
    { id: 'science-lab', name: 'Science Lab', type: 'lab', periodsPerWeek: 2, color: 'lab', requiresResource: 'sci-lab' },
    { id: 'hindi', name: 'Hindi', type: 'theory', periodsPerWeek: 4, color: 'language', requiresResource: null },
  ];

  const allDays = store.school.days;
  const allPeriods = Array.from({ length: 8 }, (_, i) => i);
  const fullAvail = {};
  allDays.forEach(d => { fullAvail[d] = [...allPeriods]; });

  store.teachers = [
    { id: 't1', name: 'Dr. Sarah Mitchell', subjects: ['math'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't2', name: 'Mr. James Cooper', subjects: ['science', 'science-lab'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't3', name: 'Ms. Emily Watson', subjects: ['english'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't4', name: 'Mr. David Chen', subjects: ['history', 'geography'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't5', name: 'Ms. Rachel Adams', subjects: ['art', 'music'], availability: { ...fullAvail }, fullTime: false, maxPeriodsPerDay: 4 },
    { id: 't6', name: 'Mr. Chris Evans', subjects: ['pe'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't7', name: 'Ms. Priya Sharma', subjects: ['computer'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't8', name: 'Mr. Rahul Verma', subjects: ['hindi'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't9', name: 'Ms. Linda Park', subjects: ['math', 'science'], availability: { ...fullAvail }, fullTime: true, maxPeriodsPerDay: 6 },
    { id: 't10', name: 'Mr. Alan Brooks', subjects: ['english', 'history'], availability: { ...fullAvail }, fullTime: false, maxPeriodsPerDay: 4 },
  ];

  // Make part-time teachers unavailable some days
  store.teachers[4].availability = {
    Monday: [...allPeriods], Tuesday: [...allPeriods], Wednesday: [...allPeriods],
    Thursday: [], Friday: []
  };
  store.teachers[9].availability = {
    Monday: [], Tuesday: [...allPeriods], Wednesday: [...allPeriods],
    Thursday: [...allPeriods], Friday: [...allPeriods]
  };

  store.resources = [
    { id: 'sci-lab', name: 'Science Laboratory', type: 'lab', capacity: 40 },
    { id: 'comp-lab', name: 'Computer Lab', type: 'lab', capacity: 35 },
    { id: 'ground', name: 'Sports Ground', type: 'ground', capacity: 80 },
    { id: 'art-room', name: 'Art Room', type: 'room', capacity: 40 },
    { id: 'music-room', name: 'Music Room', type: 'room', capacity: 35 },
  ];

  store.learningGroups = [
    {
      id: 'lg1',
      name: 'Grade 5 PE Group',
      classes: ['Grade 5-A', 'Grade 5-B'],
      subject: 'pe',
      teacher: 't6',
      resource: 'ground',
      periodsPerWeek: 3
    },
    {
      id: 'lg2',
      name: 'Grade 6 PE Group',
      classes: ['Grade 6-A', 'Grade 6-B'],
      subject: 'pe',
      teacher: 't6',
      resource: 'ground',
      periodsPerWeek: 3
    }
  ];
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
