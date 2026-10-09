const AppError = require('../utils/AppError');

const PAGE_SIZE = 20;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Search by name (case-insensitive, literal) + pagination, 20 per page.
 *  `branch` scopes the query to one branch's stock. */
async function listItems(model, { q = '', page = 1, branch = null } = {}) {
  const current = Math.max(1, parseInt(page, 10) || 1);
  const filter = branch ? { branch } : {};
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

  const [items, total] = await Promise.all([
    model
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((current - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    model.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: current,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
  };
}

async function getItem(model, id) {
  const item = await model.findById(id).catch(() => null);
  if (!item) throw new AppError('Entry not found', 404);
  return item;
}

async function createItem(model, data) {
  return model.create(data);
}

async function updateItem(model, id, data) {
  const item = await model
    .findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .catch(() => null);
  if (!item) throw new AppError('Entry not found', 404);
  return item;
}

async function deleteItem(model, id) {
  const item = await model.findByIdAndDelete(id).catch(() => null);
  if (!item) throw new AppError('Entry not found', 404);
  return item;
}

module.exports = {
  PAGE_SIZE,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};
