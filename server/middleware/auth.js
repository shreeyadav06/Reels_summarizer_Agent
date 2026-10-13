const admin = require('firebase-admin');

let isInitialized = false;

function initFirebase() {
  if (isInitialized) return true;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isInitialized = true;
      return true;
    } catch (e) {
      console.warn('⚠️ Could not initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId) {
    try {
      admin.initializeApp({ projectId });
      isInitialized = true;
      return true;
    } catch (e) {
      console.warn('⚠️ Could not initialize Firebase Admin with FIREBASE_PROJECT_ID:', e.message);
    }
  }

  return false;
}

/**
 * Authentication middleware
 * If Firebase is configured via FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT,
 * verifies the Bearer ID token. If not configured, allows requests in dev/fallback mode.
 *
 * @param {object} options
 * @param {boolean} options.optional - If true, permits unauthenticated requests but attaches user if present.
 */
function authMiddleware({ optional = false } = {}) {
  return async (req, res, next) => {
    const initialized = initFirebase();

    // If Firebase Admin is not configured in environment, allow dev/local usage
    if (!initialized) {
      req.user = null;
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    }

    const token = authHeader.split('Bearer ')[1].trim();

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
    }
  };
}

module.exports = { authMiddleware, admin };
