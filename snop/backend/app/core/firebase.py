import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
import os

# 1) Download a service account JSON from Firebase console
# 2) Set env var: FIREBASE_CREDENTIALS=path/to/serviceAccount.json
# 3) Set env var: FIREBASE_STORAGE_BUCKET=your-project.appspot.com

if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
    cred = credentials.Certificate(cred_path)
    app = firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})

db = firestore.client()
bucket = storage.bucket()
