import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatSalary(salary: string | null | undefined): string {
  if (!salary || salary === 'Not specified') return 'Not specified';
  
  // If it already contains $ or other currency symbols, return as is
  if (salary.includes('$') || salary.includes('€') || salary.includes('£')) {
    return salary;
  }
  
  // Try to parse and format numbers
  const numbers = salary.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const formattedNumbers = numbers.map(num => {
      const parsed = parseInt(num);
      if (parsed >= 1000) {
        return `$${(parsed / 1000).toFixed(0)}k`;
      }
      return `$${parsed}`;
    });
    
    if (formattedNumbers.length === 2) {
      return `${formattedNumbers[0]} - ${formattedNumbers[1]}`;
    }
    return formattedNumbers[0];
  }
  
  return salary;
}

export function getScoreColor(score: number): string {
  if (score >= 9) return 'text-green-600 bg-green-50';
  if (score >= 7) return 'text-blue-600 bg-blue-50';
  if (score >= 5) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}