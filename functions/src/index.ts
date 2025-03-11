import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// This ensures the Firebase Extension's functions will be deployed
export const placeholder = functions.https.onRequest((request, response) => {
  response.send("Firebase Functions are running");
});
