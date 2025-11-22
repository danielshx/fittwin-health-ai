import { CalendarEvent } from "@/types";

export function parseICalendar(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);
  
  let currentEvent: Partial<CalendarEvent> | null = null;
  let currentField = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Handle line continuation (lines starting with space or tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].trim();
    }
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = { id: crypto.randomUUID() };
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.title && currentEvent.start) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const field = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      
      // Parse SUMMARY (event title)
      if (field.startsWith('SUMMARY')) {
        currentEvent.title = value;
      }
      
      // Parse DTSTART (start datetime)
      else if (field.startsWith('DTSTART')) {
        currentEvent.start = parseICalDateTime(value);
      }
      
      // Parse DTEND (end datetime)
      else if (field.startsWith('DTEND')) {
        currentEvent.end = parseICalDateTime(value);
      }
      
      // Parse DESCRIPTION
      else if (field.startsWith('DESCRIPTION')) {
        currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
      }
      
      // Parse LOCATION
      else if (field.startsWith('LOCATION')) {
        currentEvent.location = value;
      }
      
      // Parse all-day events
      else if (field === 'DTSTART;VALUE=DATE') {
        currentEvent.start = parseICalDate(value);
        currentEvent.allDay = true;
      }
    }
  }
  
  return events;
}

function parseICalDateTime(dateTimeStr: string): string {
  // Format: 20240315T143000Z or 20240315T143000
  // Remove 'Z' if present
  const cleaned = dateTimeStr.replace('Z', '');
  
  // Extract components
  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);
  const hour = cleaned.substring(9, 11);
  const minute = cleaned.substring(11, 13);
  const second = cleaned.substring(13, 15);
  
  // Return ISO format
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function parseICalDate(dateStr: string): string {
  // Format: 20240315
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
}
