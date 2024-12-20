import app from './core/app';
import functions from 'firebase-functions';
import admin from 'firebase-admin'

admin.initializeApp();

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export const api = functions.https.onRequest(app);
