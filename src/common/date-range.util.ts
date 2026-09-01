export function buildCreatedAtRangeFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return undefined;

  const range: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    range.gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }

  return range;
}
