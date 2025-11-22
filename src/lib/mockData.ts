import { DailyMetrics, CalendarEvent } from "@/types";

// Generate realistic mock data for the past 30 days
export function generateMockMetrics(days: number = 30): DailyMetrics[] {
  const metrics: DailyMetrics[] = [];
  const today = new Date();
  
  // Simulate different phases
  const phases = [
    { name: "normal", days: 10, stress: 40 },
    { name: "exam_prep", days: 7, stress: 70 },
    { name: "recovery", days: 7, stress: 30 },
    { name: "exam_week", days: 6, stress: 85 },
  ];
  
  let phaseIndex = 0;
  let daysInPhase = 0;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const currentPhase = phases[phaseIndex];
    daysInPhase++;
    
    if (daysInPhase > currentPhase.days && phaseIndex < phases.length - 1) {
      phaseIndex++;
      daysInPhase = 1;
    }
    
    const phase = phases[phaseIndex];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Base values with phase influence
    const baseHRV = 65 - (phase.stress / 5);
    const baseRestingHR = 55 + (phase.stress / 4);
    const baseSleep = isWeekend ? 8.5 : 7.2;
    const baseSleepEff = 88 - (phase.stress / 5);
    
    // Add realistic variation
    const hrvVariation = (Math.random() - 0.5) * 15;
    const hrVariation = (Math.random() - 0.5) * 8;
    const sleepVariation = (Math.random() - 0.5) * 1.5;
    const effVariation = (Math.random() - 0.5) * 12;
    
    metrics.push({
      date: dateStr,
      sleepHours: Math.max(5, Math.min(10, baseSleep + sleepVariation)),
      sleepEfficiency: Math.max(60, Math.min(98, baseSleepEff + effVariation)),
      hrv: Math.max(35, Math.min(90, baseHRV + hrvVariation)),
      restingHr: Math.max(45, Math.min(75, baseRestingHR + hrVariation)),
      steps: isWeekend ? Math.floor(5000 + Math.random() * 8000) : Math.floor(7000 + Math.random() * 8000),
      workoutMinutes: isWeekend ? Math.floor(Math.random() * 60) : (phase.stress > 70 ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 60)),
      trainingLoad: phase.stress > 70 ? Math.floor(30 + Math.random() * 30) : Math.floor(40 + Math.random() * 40),
      stressScore: Math.max(20, Math.min(95, phase.stress + (Math.random() - 0.5) * 20)),
      moodScore: Math.max(1, Math.min(5, Math.round(3.5 - (phase.stress / 40) + (Math.random() - 0.5)))),
      energyScore: Math.max(1, Math.min(5, Math.round(3.5 - (phase.stress / 40) + (Math.random() - 0.5)))),
    });
  }
  
  return metrics;
}

export function getDefaultProfile() {
  return {
    name: "",
    goal: "maintain" as const,
    chronotype: "normal" as const,
    trainingFrequency: 3,
    baselineSleepNeed: 8,
    examPhase: false,
    onboardingComplete: false,
  };
}

// Generate realistic mock calendar events for the next 14 days
export function generateMockCalendar(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = new Date();
  
  // Event templates
  const workEvents = [
    { title: "Team Standup", duration: 30, startHour: 9 },
    { title: "Project Review", duration: 60, startHour: 14 },
    { title: "Client Call", duration: 45, startHour: 15 },
    { title: "Sprint Planning", duration: 90, startHour: 10 },
    { title: "1-on-1 with Manager", duration: 30, startHour: 16 },
    { title: "Design Review", duration: 60, startHour: 11 },
    { title: "All-Hands Meeting", duration: 60, startHour: 10 },
    { title: "Code Review Session", duration: 45, startHour: 13 },
    { title: "Department Sync", duration: 30, startHour: 14 },
    { title: "Product Demo", duration: 45, startHour: 11 },
    { title: "Technical Workshop", duration: 120, startHour: 13 },
    { title: "Strategy Meeting", duration: 90, startHour: 14 },
  ];
  
  const workoutEvents = [
    { title: "Morning Run", duration: 45, startHour: 7, type: "workout" },
    { title: "Gym Session", duration: 60, startHour: 18, type: "workout" },
    { title: "Yoga Class", duration: 60, startHour: 19, type: "workout" },
    { title: "HIIT Training", duration: 30, startHour: 6, type: "workout" },
    { title: "Swimming", duration: 60, startHour: 7, type: "workout" },
    { title: "Pilates Class", duration: 60, startHour: 18, type: "workout" },
    { title: "Cycling", duration: 75, startHour: 7, type: "workout" },
    { title: "Boxing Class", duration: 60, startHour: 19, type: "workout" },
  ];
  
  const personalEvents = [
    { title: "Lunch with Friends", duration: 90, startHour: 12 },
    { title: "Doctor's Appointment", duration: 45, startHour: 14 },
    { title: "Grocery Shopping", duration: 60, startHour: 17 },
    { title: "Coffee Chat", duration: 45, startHour: 15 },
    { title: "Dentist Appointment", duration: 60, startHour: 10 },
    { title: "Physical Therapy", duration: 60, startHour: 16 },
    { title: "Car Service", duration: 90, startHour: 9 },
    { title: "Haircut", duration: 45, startHour: 11 },
    { title: "Package Pickup", duration: 30, startHour: 17 },
    { title: "Bank Appointment", duration: 45, startHour: 14 },
  ];
  
  const socialEvents = [
    { title: "Dinner with Family", duration: 120, startHour: 18 },
    { title: "Movie Night", duration: 150, startHour: 19 },
    { title: "Birthday Party", duration: 180, startHour: 18 },
    { title: "Concert", duration: 180, startHour: 20 },
    { title: "Game Night", duration: 120, startHour: 19 },
    { title: "Happy Hour", duration: 90, startHour: 17 },
    { title: "Brunch", duration: 120, startHour: 11 },
  ];
  
  const learningEvents = [
    { title: "Online Course: React", duration: 90, startHour: 20 },
    { title: "Spanish Class", duration: 60, startHour: 18 },
    { title: "Book Club Meeting", duration: 90, startHour: 19 },
    { title: "Photography Workshop", duration: 120, startHour: 14 },
  ];
  
  const examEvents = [
    { title: "Study Session: Math", duration: 120, startHour: 14, description: "Prepare for midterm exam" },
    { title: "Group Study", duration: 90, startHour: 16, description: "Study group for finals" },
    { title: "Midterm Exam", duration: 180, startHour: 9, description: "Mathematics midterm" },
    { title: "Final Exam", duration: 180, startHour: 13, description: "Computer Science final" },
    { title: "Project Presentation", duration: 60, startHour: 11, description: "Present capstone project" },
  ];
  
  let eventId = 1;
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = date.toISOString().split('T')[0];
    
    // Weekday schedule
    if (!isWeekend) {
      // Morning workout (3x per week)
      if ([1, 3, 5].includes(dayOfWeek) && Math.random() > 0.3) {
        const workout = workoutEvents[Math.floor(Math.random() * workoutEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(workout.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + workout.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: workout.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: "Scheduled workout session",
        });
      }
      
      // Lunch break (most days)
      if (Math.random() > 0.3) {
        const startTime = new Date(date);
        startTime.setHours(12, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 60);
        
        events.push({
          id: `event_${eventId++}`,
          title: Math.random() > 0.5 ? "Lunch Break" : "Team Lunch",
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
      
      // Work events (3-5 per day)
      const numWorkEvents = Math.floor(Math.random() * 3) + 3;
      const shuffledWork = [...workEvents].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < numWorkEvents; j++) {
        const event = shuffledWork[j];
        const startTime = new Date(date);
        startTime.setHours(event.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + event.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: event.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          location: Math.random() > 0.5 ? "Office" : "Video Call",
        });
      }
      
      // Evening workout (2x per week)
      if ([2, 4].includes(dayOfWeek) && Math.random() > 0.4) {
        const workout = workoutEvents[Math.floor(Math.random() * workoutEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(workout.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + workout.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: workout.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: "Evening training session",
        });
      }
      
      // Personal appointments (scattered throughout the week)
      if (Math.random() > 0.6) {
        const personal = personalEvents[Math.floor(Math.random() * personalEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(personal.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + personal.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: personal.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
      
      // Learning/development (2x per week)
      if ([2, 4].includes(dayOfWeek) && Math.random() > 0.5) {
        const learning = learningEvents[Math.floor(Math.random() * learningEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(learning.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + learning.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: learning.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: "Personal development",
        });
      }
      
      // Evening social (1-2x per week)
      if ([3, 5].includes(dayOfWeek) && Math.random() > 0.6) {
        const social = socialEvents[Math.floor(Math.random() * socialEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(social.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + social.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: social.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
      
      // Exam period events (days 7-10)
      if (i >= 7 && i <= 10) {
        const examEvent = examEvents[Math.min(i - 7, examEvents.length - 1)];
        const startTime = new Date(date);
        startTime.setHours(examEvent.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + examEvent.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: examEvent.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: examEvent.description,
          location: i === 9 || i === 10 ? "Exam Hall B" : "Library",
        });
      }
    } else {
      // Weekend schedule - more relaxed but still full
      // Weekend workout (morning)
      if (Math.random() > 0.3) {
        const workout = workoutEvents[Math.floor(Math.random() * workoutEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(workout.startHour + 1, 30, 0, 0); // Later on weekends
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + workout.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: workout.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: "Weekend training",
        });
      }
      
      // Brunch or lunch social event
      if (Math.random() > 0.4) {
        const social = dayOfWeek === 0 ? socialEvents[6] : socialEvents[Math.floor(Math.random() * 3)]; // Brunch on Sunday
        const startTime = new Date(date);
        startTime.setHours(social.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + social.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: social.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
      
      // Personal errands/appointments
      if (Math.random() > 0.5) {
        const personal = personalEvents[Math.floor(Math.random() * personalEvents.length)];
        const startTime = new Date(date);
        startTime.setHours(personal.startHour + 1, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + personal.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: personal.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
      
      // Weekend social activities (Saturday evening)
      if (dayOfWeek === 6 && Math.random() > 0.4) {
        const social = socialEvents[Math.floor(Math.random() * (socialEvents.length - 1))];
        const startTime = new Date(date);
        startTime.setHours(social.startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + social.duration);
        
        events.push({
          id: `event_${eventId++}`,
          title: social.title,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
      
      // Sunday relaxation or hobby time
      if (dayOfWeek === 0 && Math.random() > 0.5) {
        const startTime = new Date(date);
        startTime.setHours(15, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 120);
        
        events.push({
          id: `event_${eventId++}`,
          title: "Hobby Time",
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: "Personal project work",
        });
      }
    }
    
    // Add early morning commitment (one during the period)
    if (i === 5) {
      const startTime = new Date(date);
      startTime.setHours(6, 30, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 90);
      
      events.push({
        id: `event_${eventId++}`,
        title: "Early Flight to Conference",
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        location: "Airport",
        description: "Need to wake up at 5:00 AM",
      });
    }
  }
  
  // Sort events by start time
  events.sort((a, b) => a.start.localeCompare(b.start));
  
  return events;
}
