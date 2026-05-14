import { Student } from "@workspace/api-client-react";

/**
 * Binary search utilities — O(log n) lookup on sorted arrays.
 * Prefix-aware: finds all students whose ID/name starts with the query.
 */

function lowerBound(arr: string[], target: string): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Returns all students whose studentId starts with the given prefix (case-insensitive). O(log n + k) */
export function binarySearchByStudentId(
  students: Student[],
  prefix: string
): Student[] {
  if (!prefix.trim()) return [];
  const lower = prefix.trim().toLowerCase();
  const sorted = [...students].sort((a, b) =>
    a.studentId.toLowerCase().localeCompare(b.studentId.toLowerCase())
  );
  const keys = sorted.map(s => s.studentId.toLowerCase());
  const start = lowerBound(keys, lower);
  const results: Student[] = [];
  for (let i = start; i < sorted.length && sorted[i].studentId.toLowerCase().startsWith(lower); i++) {
    results.push(sorted[i]);
  }
  return results;
}

/** Returns all students whose name starts with the given prefix (case-insensitive). O(log n + k) */
export function binarySearchByName(
  students: Student[],
  prefix: string
): Student[] {
  if (!prefix.trim()) return [];
  const lower = prefix.trim().toLowerCase();
  const sorted = [...students].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  const keys = sorted.map(s => s.name.toLowerCase());
  const start = lowerBound(keys, lower);
  const results: Student[] = [];
  for (let i = start; i < sorted.length && sorted[i].name.toLowerCase().startsWith(lower); i++) {
    results.push(sorted[i]);
  }
  return results;
}
