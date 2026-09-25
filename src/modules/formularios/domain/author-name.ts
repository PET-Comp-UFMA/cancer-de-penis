// Author names accept letters (accented included), spaces, apostrophes (' and ’) and periods.
const DISALLOWED = /[^\p{L}\p{M} '’.]/gu;

export function isValidAuthorName(name: string): boolean {
  return !new RegExp(DISALLOWED.source, 'u').test(name);
}

export function cleanAuthorName(name: string): string {
  return name.replace(DISALLOWED, '');
}
