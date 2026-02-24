export function str(v, { min = 0, max = 5000, field = 'value', required = false } = {}) {
  if ((v === undefined || v === null || v === '') && !required) return null;
  if (typeof v !== 'string') throw bad(`${field} must be a string`);
  const s = v.trim();
  if (required && s.length < min) throw bad(`${field} is required`);
  if (s.length < min) throw bad(`${field} is too short`);
  if (s.length > max) throw bad(`${field} is too long`);
  return s;
}

export function oneOf(v, options, { field = 'value', required = false } = {}) {
  if ((v === undefined || v === null || v === '') && !required) return null;
  if (!options.includes(v)) throw bad(`${field} must be one of: ${options.join(', ')}`);
  return v;
}

export function dateYmd(v, { field = 'date' } = {}) {
  if (!v) return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw bad(`${field} must be YYYY-MM-DD`);
  return v;
}

export function tags(v) {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw bad('tags must be an array');
  return v.map(x => String(x).trim()).filter(Boolean).slice(0, 20);
}

export function optionalId(v, { field = 'id' } = {}) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string') throw bad(`${field} must be a string`);
  return v;
}

export function intInRange(v, { field = 'value', min = 0, max = 10, required = false } = {}) {
  if ((v === undefined || v === null || v === '') && !required) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) throw bad(`${field} must be an integer`);
  if (n < min || n > max) throw bad(`${field} must be between ${min} and ${max}`);
  return n;
}

export function bad(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}
