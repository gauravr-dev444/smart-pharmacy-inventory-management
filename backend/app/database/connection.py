import os
import logging
from typing import Dict, Any, List, Optional
import firebase_admin
from firebase_admin import credentials, firestore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DBConnection")

# Path to the Firebase service account certificate JSON
CREDENTIALS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 
    "serviceAccountKey.json"
)

class DBConnection:
    def __init__(self):
        self.db_client = None
        self.is_firebase = False
        self._initialize_db()

    def _initialize_db(self):
        if not os.path.exists(CREDENTIALS_PATH):
            error_msg = f"Firebase credentials file not found at {CREDENTIALS_PATH}. Firebase connection is mandatory."
            logger.critical(error_msg)
            raise FileNotFoundError(error_msg)

        try:
            logger.info(f"Loading service account from {CREDENTIALS_PATH}...")
            cred = credentials.Certificate(CREDENTIALS_PATH)
            
            # Initialize default app if not already initialized
            try:
                firebase_admin.get_app()
            except ValueError:
                firebase_admin.initialize_app(cred)
                
            self.db_client = firestore.client()
            self.is_firebase = True
            logger.info("Firebase Firestore client successfully initialized.")
        except Exception as e:
            logger.critical(f"Critical error initializing Firestore connection: {str(e)}")
            raise e

    def get_all(self, collection: str) -> List[Dict[str, Any]]:
        try:
            docs = self.db_client.collection(collection).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Firestore get_all error on '{collection}': {str(e)}")
            raise e

    def get_by_id(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc_ref = self.db_client.collection(collection).document(str(doc_id))
            doc = doc_ref.get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error(f"Firestore get_by_id error on '{collection}/{doc_id}': {str(e)}")
            raise e

    def create(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        try:
            self.db_client.collection(collection).document(str(doc_id)).set(data)
            return True
        except Exception as e:
            logger.error(f"Firestore create error on '{collection}/{doc_id}': {str(e)}")
            raise e

    def update(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        try:
            self.db_client.collection(collection).document(str(doc_id)).update(data)
            return True
        except Exception as e:
            logger.error(f"Firestore update error on '{collection}/{doc_id}': {str(e)}")
            raise e

    def delete(self, collection: str, doc_id: str) -> bool:
        try:
            self.db_client.collection(collection).document(str(doc_id)).delete()
            return True
        except Exception as e:
            logger.error(f"Firestore delete error on '{collection}/{doc_id}': {str(e)}")
            raise e

    def query(self, collection: str, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        try:
            coll_ref = self.db_client.collection(collection)
            if operator == "==":
                docs = coll_ref.where(field, "==", value).stream()
            elif operator == ">":
                docs = coll_ref.where(field, ">", value).stream()
            elif operator == "<":
                docs = coll_ref.where(field, "<", value).stream()
            elif operator == ">=":
                docs = coll_ref.where(field, ">=", value).stream()
            elif operator == "<=":
                docs = coll_ref.where(field, "<=", value).stream()
            elif operator == "in":
                docs = coll_ref.where(field, "in", value).stream()
            else:
                docs = coll_ref.stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Firestore query error on '{collection}': {str(e)}")
            raise e

# Singleton instance
db = DBConnection()
