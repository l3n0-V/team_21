import os
import firebase_admin
from firebase_admin import credentials, firestore


# This file contains the firebase configuration details.
firebaseConfig = {
  "apiKey": "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow",
  "authDomain": "snop-b76ac.firebaseapp.com",
  "projectId": "snop-b76ac",
  "storageBucket": "snop-b76ac.firebasestorage.app",
  "messagingSenderId": "211954707057",
  "appId": "1:211954707057:web:a52a9afc2133aeb60789d0",
  "measurementId": "G-WW0ZQGB68L"
}


# Initialize Admin SDK once per process
if not firebase_admin._apps:
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS not set. Put it in .env")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

#Firestpre client for the backend
db = firestore.client()