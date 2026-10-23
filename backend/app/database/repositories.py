from typing import List, Dict, Any, Optional
from app.database.connection import db

class BaseRepository:
    def __init__(self, collection_name: str):
        self.collection = collection_name

    def get_all(self) -> List[Dict[str, Any]]:
        return db.get_all(self.collection)

    def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return db.get_by_id(self.collection, doc_id)

    def create(self, doc_id: str, data: Dict[str, Any]) -> bool:
        return db.create(self.collection, doc_id, data)

    def update(self, doc_id: str, data: Dict[str, Any]) -> bool:
        return db.update(self.collection, doc_id, data)

    def delete(self, doc_id: str) -> bool:
        return db.delete(self.collection, doc_id)

    def query(self, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        return db.query(self.collection, field, operator, value)


class UsersRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        users = self.query("email", "==", email)
        return users[0] if users else None


class MedicinesRepository(BaseRepository):
    def __init__(self):
        super().__init__("medicines")


class InventoryRepository(BaseRepository):
    def __init__(self):
        super().__init__("inventory")


class SalesRepository(BaseRepository):
    def __init__(self):
        super().__init__("sales")


class SuppliersRepository(BaseRepository):
    def __init__(self):
        super().__init__("suppliers")


class ForecastsRepository(BaseRepository):
    def __init__(self):
        super().__init__("forecasts")


class AlertsRepository(BaseRepository):
    def __init__(self):
        super().__init__("alerts")

# Instantiated repositories
users_repo = UsersRepository()
medicines_repo = MedicinesRepository()
inventory_repo = InventoryRepository()
sales_repo = SalesRepository()
suppliers_repo = SuppliersRepository()
forecasts_repo = ForecastsRepository()
alerts_repo = AlertsRepository()
