import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAccurateOrderDate(dateStr: string, dayName: string): Date {
  const d = new Date(dateStr);
  const correctDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
  
  if (correctDayIndex !== -1 && d.getDay() !== correctDayIndex) {
    // If the parsed date inherently misaligns with the targeted dayName (e.g. from previous timezone shift bugs)
    // Adjust it by one day forward since the bug exclusively shifted time backwards across midnight bounds
    d.setDate(d.getDate() + 1);
  }
  return d;
}
