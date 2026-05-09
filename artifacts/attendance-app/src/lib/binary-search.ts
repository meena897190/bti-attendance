import { Student } from "@workspace/api-client-react";

/**
 * Binary search utility for finding students.
 * Time Complexity: O(log n)
 */

export function binarySearchByStudentId(
  students: Student[],
  studentId: string
): Student | undefined {
  // Array sorting pre-step to guarantee sorted array for O(log n) search
  const sorted = [...students].sort((a, b) => a.studentId.localeCompare(b.studentId));
  
  let left = 0;
  let right = sorted.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = sorted[mid].studentId;

    if (midVal === studentId) {
      return sorted[mid];
    }
    
    if (midVal < studentId) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return undefined;
}

export function binarySearchByName(
  students: Student[],
  name: string
): Student | undefined {
  // Array sorting pre-step to guarantee sorted array for O(log n) search
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));
  
  const target = name.toLowerCase();
  
  let left = 0;
  let right = sorted.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = sorted[mid].name.toLowerCase();

    if (midVal === target) {
      return sorted[mid];
    }
    
    if (midVal < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return undefined;
}
