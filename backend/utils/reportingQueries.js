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

/** Parse custom date range from from/to parameters */
const parseCustomDateRange = (from, to) => {
  if (!from && !to) return null;
  
  const query = {};
  if (from) {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    query.$gte = startDate;
  }
  if (to) {
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    query.$lte = endDate;
  }
  
  return Object.keys(query).length > 0 ? query : null;
};

/** Paid (completed) orders in the selected period — used for revenue, profit, charts. */
const buildPaidOrdersQuery = (range, from, to) => {
  const query = { status: "completed" };
  
  // Support custom date range if from/to are provided
  if (from || to) {
    const dateFilter = parseCustomDateRange(from, to);
    if (dateFilter) query.createdAt = dateFilter;
  } else {
    // Legacy support for preset ranges
    const dateFilter = parseDateRange(range);
    if (dateFilter) query.createdAt = dateFilter;
  }
  
  return query;
};

module.exports = {
  parseDateRange,
  parseCustomDateRange,
  buildPaidOrdersQuery,
};
