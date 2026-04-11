const parseDateRange = (range) => {
  const now = new Date();
  if (!range || range === "all") return null;

  const start = new Date(now);
  switch (String(range)) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      return null;
  }
  return { $gte: start };
};

/** Paid (completed) orders in the selected period — used for revenue, profit, charts. */
const buildPaidOrdersQuery = (range) => {
  const query = { status: "completed" };
  const dateFilter = parseDateRange(range);
  if (dateFilter) query.createdAt = dateFilter;
  return query;
};

module.exports = {
  parseDateRange,
  buildPaidOrdersQuery,
};
