const admin = require('firebase-admin');
const serviceAccount = require(process.env.FIREBASE_CREDENTIAL_FILE);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

module.exports = admin;
