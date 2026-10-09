const AppError = require('../utils/AppError');
const { item } = require('../validators/schema');
const { getModule } = require('../config/modules');
const items = require('../services/item.service');
const audit = require('../services/audit.service');
const listImages = require('../utils/productImages');

/**
 * One generic controller for Bakery, Pastries and Snacks. Everything is
 * parameterised by the module registry entry (model + labels), so the three
 * modules share a single implementation.
 */

function resolveModule(key) {
  const mod = getModule(key);
  if (!mod) throw new AppError('Unknown module', 404);
  return mod;
}

function fieldErrors(error) {
  const errors = {};
  if (!error) return errors;
  error.details.forEach((detail) => {
    const key = detail.path.join('.');
    if (!errors[key]) errors[key] = detail.message;
  });
  return errors;
}

/** Rebuild the submitted values so the form keeps what was typed. */
function formValues(body) {
  body = body || {};
  return {
    name: body.name || '',
    price: body.price === undefined || body.price === null ? '' : body.price,
    quantity:
      body.quantity === undefined || body.quantity === null ? '' : body.quantity,
    status: body.status === 'out' ? 'out' : body.status === 'in' ? 'in' : '',
    image: body.image || '',
  };
}

function renderForm(req, res, { mod, values, errors = {}, formError = null, item = null }) {
  const base = `/dashboard/${mod.path}`;
  return res.render('admin/module/item-form', {
    title: item ? `Edit ${mod.singular.toLowerCase()}` : `Add to ${mod.heading}`,
    mod,
    item,
    values,
    errors,
    formError,
    images: listImages(),
    formAction: item ? `${base}/${item._id}/edit` : `${base}/new`,
  });
}

/* ------------------------------- List ------------------------------- */

async function list(req, res, next) {
  try {
    const mod = resolveModule(req.params.module);
    const q = (req.query.q || '').toString().trim();
    const result = await items.listItems(mod.model, {
      q,
      page: req.query.page,
    });

    return res.render(`admin/module/${mod.key}`, {
      title: mod.heading,
      mod,
      q,
      ...result,
    });
  } catch (err) {
    return next(err);
  }
}

/* ------------------------------ Create ------------------------------ */

function createForm(req, res, next) {
  try {
    const mod = resolveModule(req.params.module);
    return renderForm(req, res, {
      mod,
      values: formValues({ status: 'in' }),
      errors: {},
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const mod = resolveModule(req.params.module);
    const { error, value } = item.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(422).render('admin/module/item-form', {
        title: `Add to ${mod.heading}`,
        mod,
        item: null,
        values: formValues(req.body),
        errors: fieldErrors(error),
        formError: 'Please fix the fields below.',
        images: listImages(),
        formAction: `/dashboard/${mod.path}/new`,
      });
    }

    const created = await items.createItem(mod.model, value);

    await audit.record({
      user: req.session.user,
      action: 'create',
      module: mod.key,
      targetId: created._id,
      summary: `${mod.singular} added: ${created.name}`,
    });

    req.flash('success', `${mod.singular} added`);
    return res.redirect(`/dashboard/${mod.path}`);
  } catch (err) {
    return next(err);
  }
}

/* ------------------------------- Edit ------------------------------- */

async function editForm(req, res, next) {
  try {
    const mod = resolveModule(req.params.module);
    const found = await items.getItem(mod.model, req.params.id);
    return renderForm(req, res, {
      mod,
      item: found,
      values: {
        name: found.name,
        price: found.price,
        quantity: found.quantity,
        status: found.status,
        image: found.image || '',
      },
      errors: {},
    });
  } catch (err) {
    return next(err);
  }
}

async function edit(req, res, next) {
  try {
    const mod = resolveModule(req.params.module);
    const existing = await items.getItem(mod.model, req.params.id);

    const { error, value } = item.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(422).render('admin/module/item-form', {
        title: `Edit ${mod.singular.toLowerCase()}`,
        mod,
        item: existing,
        values: formValues(req.body),
        errors: fieldErrors(error),
        formError: 'Please fix the fields below.',
        images: listImages(),
        formAction: `/dashboard/${mod.path}/${existing._id}/edit`,
      });
    }

    const updated = await items.updateItem(mod.model, existing._id, value);

    await audit.record({
      user: req.session.user,
      action: 'update',
      module: mod.key,
      targetId: updated._id,
      summary: `${mod.singular} updated: ${updated.name}`,
    });

    req.flash('success', `${mod.singular} updated`);
    return res.redirect(`/dashboard/${mod.path}`);
  } catch (err) {
    return next(err);
  }
}

/* ------------------------------ Delete ------------------------------ */

async function remove(req, res, next) {
  try {
    const mod = resolveModule(req.params.module);
    const existing = await items.getItem(mod.model, req.params.id);
    await items.deleteItem(mod.model, existing._id);

    await audit.record({
      user: req.session.user,
      action: 'delete',
      module: mod.key,
      targetId: existing._id,
      summary: `${mod.singular} deleted: ${existing.name}`,
    });

    req.flash('success', `${mod.singular} deleted`);
    return res.redirect(`/dashboard/${mod.path}`);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, createForm, create, editForm, edit, remove };
