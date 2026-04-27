import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAccurateOrderDate(dateStr?: string, dayName?: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  
  if (dayName) {
    const correctDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
    if (correctDayIndex !== -1 && d.getDay() !== correctDayIndex) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}
