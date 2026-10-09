const crypto = require('crypto');
const mongoose = require('mongoose');
const Session = require('../models/sessions');

/**
 * Minimal server-side session middleware backed by MongoDB, with an in-memory
 * fallback so pages still render when Mongo is unreachable.
 *
 * The project has no npm registry access (express-session / connect-mongo
 * could not be installed), so this is the project's own equivalent:
 *   - signed httpOnly cookie  ->  sid  ->  Session document in Mongo
 *   - req.session (plain object) with save / destroy / regenerate
 */

const COOKIE_NAME = 'foodco.sid';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const memoryStore = new Map(); // fallback when Mongo is down

function sign(sid, secret) {
  return crypto.createHmac('sha256', secret).update(sid).digest('base64url');
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const jar = {};
  if (!header) return jar;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    if (!key) return;
    try {
      jar[key] = decodeURIComponent(pair.slice(idx + 1).trim());
    } catch (err) {
      /* ignore malformed cookie values */
    }
  });
  return jar;
}

async function loadSession(sid) {
  const record = memoryStore.get(sid);
  const fromMemory =
    record && record.expiresAt > Date.now() ? record.data : {};

  // Fast path: no point queueing against a database that is not connected.
  if (mongoose.connection.readyState !== 1) {
    return { data: fromMemory, dbUp: false };
  }

  try {
    const doc = await Session.findOne({
      sid,
      expiresAt: { $gt: new Date() },
    }).lean();
    return { data: doc && doc.data ? doc.data : fromMemory, dbUp: true };
  } catch (err) {
    return { data: fromMemory, dbUp: false };
  }
}

async function persistSession(sid, data, ttlMs) {
  const expiresAt = new Date(Date.now() + ttlMs);
  memoryStore.set(sid, { data, expiresAt });
  if (mongoose.connection.readyState !== 1) return;
  try {
    await Session.updateOne(
      { sid },
      { $set: { data, expiresAt } },
      { upsert: true },
    );
  } catch (err) {
    // Mongo is down: the in-memory copy above still carries this request.
  }
}

async function dropSession(sid) {
  memoryStore.delete(sid);
  if (mongoose.connection.readyState !== 1) return;
  try {
    await Session.deleteOne({ sid });
  } catch (err) {
    /* nothing to clean up if Mongo is down */
  }
}

function session(options = {}) {
  const secret = options.secret || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('A session secret is required (SESSION_SECRET env var)');
  }
  const ttlMs = options.ttlMs || DEFAULT_TTL_MS;
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  return async function sessionMiddleware(req, res, next) {
    try {
      const jar = parseCookies(req);
      const raw = jar[COOKIE_NAME] || '';
      const [cookieSid, cookieSig] = raw.split('.');

      let sid = null;
      if (
        cookieSid &&
        cookieSig &&
        cookieSig === sign(cookieSid, secret)
      ) {
        sid = cookieSid;
      }

      let data = {};
      if (sid) {
        data = (await loadSession(sid)).data;
      } else {
        sid = crypto.randomBytes(24).toString('hex');
      }

      req.session = data;
      req.sessionID = sid;

      // Persist at the end of the response, once the handlers had their say.
      req.session.save = function save() {
        return persistSession(sid, req.session, ttlMs);
      };
      req.session.destroy = function destroy(callback) {
        req.session = {};
        dropSession(sid)
          .then(() => callback && callback())
          .catch(() => callback && callback());
      };
      req.session.regenerate = function regenerate(callback) {
        const oldSid = sid;
        sid = crypto.randomBytes(24).toString('hex');
        req.session = {};
        req.sessionID = sid;
        req.session.save = function save() {
          return persistSession(sid, req.session, ttlMs);
        };
        req.session.destroy = function destroy(cb) {
          req.session = {};
          dropSession(sid)
            .then(() => cb && cb())
            .catch(() => cb && cb());
        };
        req.session.regenerate = regenerate;
        // Replace any Set-Cookie already queued for the old sid.
        res.setHeader('Set-Cookie', []);
        res.cookie(COOKIE_NAME, `${sid}.${sign(sid, secret)}`, {
          ...cookieOptions,
          maxAge: ttlMs,
        });
        dropSession(oldSid).then(() => callback && callback());
      };

      res.cookie(COOKIE_NAME, `${sid}.${sign(sid, secret)}`, {
        ...cookieOptions,
        maxAge: ttlMs,
      });

      res.on('finish', () => {
        if (req.session && typeof req.session.save === 'function') {
          Promise.resolve(req.session.save()).catch(() => {});
        }
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = session;
module.exports.COOKIE_NAME = COOKIE_NAME;
