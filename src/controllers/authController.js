const User = require('../models/users');
const AppError = require('../utils/AppError');
const { auth } = require('../validators/schema');
const audit = require('../services/audit.service');
const mail = require('../services/mail.service');
const resets = require('../services/passwordReset.service');

const LOGIN_PATH = '/dashboard/pastries';
const RESET_MSG =
  'If that email is in our records, a reset link is on its way. ' +
  'The link is valid for one hour.';

/** Turn Joi details into a { field: message } map for the views. */
function fieldErrors(error) {
  const errors = {};
  if (!error) return errors;
  error.details.forEach((detail) => {
    const key = detail.path.join('.');
    if (!errors[key]) errors[key] = detail.message;
  });
  return errors;
}

function displayName(user) {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return full || user.username || user.email;
}

function showLogin(req, res) {
  if (req.session && req.session.user) return res.redirect(LOGIN_PATH);
  return res.render('admin/login', {
    title: 'Log in',
    values: { email: '' },
    errors: {},
    formError: null,
  });
}

async function login(req, res, next) {
  try {
    const { error, value } = auth.login.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(422).render('admin/login', {
        title: 'Log in',
        values: { email: (req.body && req.body.email) || '' },
        errors: fieldErrors(error),
        formError: null,
      });
    }

    const user = await User.findOne({ email: value.email });
    const passwordOk = user ? await user.isValidPassword(value.password) : false;

    if (!user || !passwordOk) {
      return res.status(401).render('admin/login', {
        title: 'Log in',
        values: { email: value.email },
        errors: {},
        formError: 'Email or password is incorrect.',
      });
    }

    const name = displayName(user);

    // New session id on login (stops session fixation).
    req.session.regenerate(async () => {
      req.session.user = {
        _id: user._id,
        name,
        email: user.email,
        role: user.role || 'admin',
      };
      await audit.record({
        user: user._id,
        action: 'login',
        module: 'auth',
        summary: `${name} logged in`,
      });
      res.redirect(LOGIN_PATH);
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const current = req.session && req.session.user;
    if (current) {
      await audit.record({
        user: current._id,
        action: 'logout',
        module: 'auth',
        summary: `${current.name} logged out`,
      });
    }
    req.session.destroy(() => {
      res.clearCookie('foodco.sid', { path: '/' });
      res.redirect('/login');
    });
  } catch (err) {
    next(err);
  }
}

function showForgot(req, res) {
  return res.render('admin/forgot-password', {
    title: 'Forgot password',
    values: { email: '' },
    errors: {},
    sent: false,
  });
}

async function forgot(req, res, next) {
  try {
    const { error, value } = auth.forgot.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(422).render('admin/forgot-password', {
        title: 'Forgot password',
        values: { email: (req.body && req.body.email) || '' },
        errors: fieldErrors(error),
        sent: false,
      });
    }

    // Same message either way: never reveal whether the email exists.
    const user = await User.findOne({ email: value.email });

    if (user) {
      const token = await resets.issueToken(user._id);
      const origin = `${req.protocol}://${req.get('host')}`;
      const link = `${origin}/reset-password/${token}`;
      const result = await mail.sendMail({
        to: user.email,
        subject: 'Reset your FoodCo password',
        text:
          `Hello ${displayName(user)},\n\n` +
          'Use the link below to choose a new password. It expires in one hour ' +
          'and can only be used once:\n\n' +
          `${link}\n\n` +
          'If you did not ask for this, you can ignore this email.\n',
      });

      if (!result.sent && process.env.NODE_ENV !== 'production') {
        // No mail service configured: surface the link in the dev console.
        console.log(`[dev] Password reset link for ${user.email}: ${link}`);
      }
    }

    return res.render('admin/forgot-password', {
      title: 'Forgot password',
      values: { email: value.email },
      errors: {},
      sent: true,
      message: RESET_MSG,
    });
  } catch (err) {
    next(err);
  }
}

async function showReset(req, res, next) {
  try {
    const outcome = await resets.consumeToken(req.params.token);
    return res.render('admin/reset-password', {
      title: 'Reset password',
      token: req.params.token,
      values: {},
      errors: {},
      tokenError: outcome.ok
        ? null
        : 'This reset link is invalid, expired or has already been used. ' +
          'Request a new one below.',
      canReset: outcome.ok,
      done: false,
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const token = req.params.token;
    const outcome = await resets.consumeToken(token);

    const renderForm = (status, errors, values) =>
      res.status(status).render('admin/reset-password', {
        title: 'Reset password',
        token,
        values,
        errors,
        tokenError: outcome.ok
          ? null
          : 'This reset link is invalid, expired or has already been used. ' +
            'Request a new one below.',
        canReset: outcome.ok,
        done: false,
      });

    if (!outcome.ok) return renderForm(410, {}, {});

    const { error, value } = auth.reset.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return renderForm(422, fieldErrors(error), {
        password: '',
        confirm: '',
      });
    }

    const user = await User.findById(outcome.doc.user);
    if (!user) return renderForm(410, {}, {});

    user.password = value.password; // hashed by the existing pre-save hook
    await user.save();
    await resets.markUsed(outcome.doc);

    await audit.record({
      user: user._id,
      action: 'password_reset',
      module: 'auth',
      targetId: user._id,
      summary: `${displayName(user)} reset their password`,
    });

    req.flash('success', 'Password updated. You can log in now.');
    return res.redirect('/login');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showLogin,
  login,
  logout,
  showForgot,
  forgot,
  showReset,
  resetPassword,
  displayName,
  fieldErrors,
};
