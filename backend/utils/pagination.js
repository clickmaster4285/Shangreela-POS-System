function parsePagination(query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(200, Math.max(1, Number(query.limit || 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginatedResponse({ items, total, page, limit }) {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

module.exports = { parsePagination, buildPaginatedResponse };
