export function formatSourceTreeTimestamp(value: string | null | undefined) {
  if (!value) {
    return 'No timestamp recorded';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}
