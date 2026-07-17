// User input goes into a $regex for search. Escaping stops a stray "(" from
// throwing, and stops a crafted pattern from pinning the CPU.
export function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
