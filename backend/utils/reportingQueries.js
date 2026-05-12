/** When no date range is given, never scan all completed orders — cap lookback. */
const REPORTING_LOOKBACK_DAYS = 366;

const getReportingWindowStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - REPORTING_LOOKBACK_DAYS);
  return d;
};

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

/**
 * Paid (completed) orders in the selected period — used for revenue, profit, charts.
 * If `range` is "all" (or unknown) and no `from`/`to`, applies a rolling lookback window
 * so the query is never unbounded.
 */
const buildPaidOrdersQuery = (range, from, to, tableNumbers = null, orderTaker = null) => {
  const query = { status: "completed" };

  if (from || to) {
    const dateFilter = parseCustomDateRange(from, to);
    if (dateFilter) query.createdAt = dateFilter;
  } else {
    const dateFilter = parseDateRange(range);
    if (dateFilter) query.createdAt = dateFilter;
  }

  if (!query.createdAt) {
    query.createdAt = { $gte: getReportingWindowStart() };
  }

  if (Array.isArray(tableNumbers)) {
    query.table = { $in: tableNumbers };
  }

  if (orderTaker && orderTaker !== "all") {
    query.orderTaker = orderTaker;
  }

  return query;
};

module.exports = {
  parseDateRange,
  parseCustomDateRange,
  buildPaidOrdersQuery,
  getReportingWindowStart,
  REPORTING_LOOKBACK_DAYS,
};
