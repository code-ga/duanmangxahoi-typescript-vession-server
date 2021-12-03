import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase-admin/app";
import admin from "firebase-admin"
import path from "path";


const firebaseApp = initializeApp({
    credential: admin.credential.cert(path.join(__dirname, '../test-upload-file-to-firebase-firebase-adminsdk-2yfds-a69a63a12c.json')),
    storageBucket: "test-upload-file-to-firebase.appspot.com"
});

// Get a reference to the storage service, which is used to create references in your storage bucket
export const bucket = admin.storage().bucket();
