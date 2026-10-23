import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "datasets")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "trained_models")
SALES_PATH = os.path.join(DATASETS_DIR, "pharmacy_sales.csv")

class MLEngine:
    def __init__(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        self.model_path = os.path.join(MODELS_DIR, "best_forecast_model.joblib")
        self.metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
        self.artifacts_path = os.path.join(MODELS_DIR, "ml_artifacts.joblib")
        
        self.model = None
        self.label_encoder = None
        self.scaler = None
        self.seasonal_demand_map = {}
        self.recent_sales_history = {}
        self.metrics = {}
        self.is_loaded = False
        
        self.load_model_and_artifacts()

    def load_model_and_artifacts(self):
        if os.path.exists(self.model_path) and os.path.exists(self.artifacts_path):
            try:
                self.model = joblib.load(self.model_path)
                artifacts = joblib.load(self.artifacts_path)
                
                self.label_encoder = artifacts['label_encoder']
                self.scaler = artifacts['scaler']
                self.seasonal_demand_map = artifacts['seasonal_demand_map']
                self.recent_sales_history = artifacts['recent_sales_history']
                
                if os.path.exists(self.metadata_path):
                    with open(self.metadata_path, 'r') as f:
                        self.metrics = json.load(f)
                
                self.is_loaded = True
                print("ML Model and artifacts loaded successfully.")
            except Exception as e:
                print(f"Error loading ML artifacts: {str(e)}")
                self.is_loaded = False

    def preprocess_and_feature_engineer(self, df_raw: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        # 1. Aggregate daily data by date and medicine
        df = df_raw.groupby(['date', 'medicine', 'category'])[['units_sold']].sum().reset_index()
        
        # 2. Convert date column
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(by=['medicine', 'date']).reset_index(drop=True)
        
        # 3. Handle Missing Values
        df['units_sold'] = df['units_sold'].fillna(0)
        
        # 4. Outlier Removal (cap at 99th percentile per medicine)
        for med in df['medicine'].unique():
            med_mask = df['medicine'] == med
            cap_val = df.loc[med_mask, 'units_sold'].quantile(0.99)
            df.loc[med_mask & (df['units_sold'] > cap_val), 'units_sold'] = cap_val
            
        # 5. Feature Engineering
        df['Month'] = df['date'].dt.month
        df['Quarter'] = df['date'].dt.quarter
        df['DayOfWeek'] = df['date'].dt.dayofweek
        
        # Seasonal Demand: Mean daily sales per medicine per month
        seasonal_map = df.groupby(['medicine', 'Month'])['units_sold'].mean().to_dict()
        df['SeasonalDemand'] = df.apply(lambda row: seasonal_map.get((row['medicine'], row['Month']), 0.0), axis=1)
        
        # Rolling Sales Average (7-day lag-1 rolling average)
        # Using shift(1) to avoid data leakage
        df['RollingAvg7'] = df.groupby('medicine')['units_sold'].shift(1).rolling(window=7, min_periods=1).mean()
        df['RollingAvg30'] = df.groupby('medicine')['units_sold'].shift(1).rolling(window=30, min_periods=1).mean()
        
        # Fill NaN values in rolling averages
        df['RollingAvg7'] = df['RollingAvg7'].fillna(df['SeasonalDemand'])
        df['RollingAvg30'] = df['RollingAvg30'].fillna(df['SeasonalDemand'])
        
        # Sales Growth Rate (7-day rolling / 30-day rolling)
        df['SalesGrowthRate'] = df['RollingAvg7'] / (df['RollingAvg30'] + 1e-5)
        df['SalesGrowthRate'] = df['SalesGrowthRate'].fillna(1.0)
        
        return df, seasonal_map

    def train_pipeline(self) -> Dict[str, Any]:
        if not os.path.exists(SALES_PATH):
            raise FileNotFoundError(f"Sales dataset not found at {SALES_PATH}")
            
        print("Reading sales dataset for training...")
        df_raw = pd.read_csv(SALES_PATH)
        
        print("Preprocessing and engineering features...")
        df, seasonal_map = self.preprocess_and_feature_engineer(df_raw)
        
        # Label encode medicine name
        le = LabelEncoder()
        df['MedicineEncoded'] = le.fit_transform(df['medicine'])
        
        # Define features and target
        feature_cols = ['MedicineEncoded', 'Month', 'Quarter', 'DayOfWeek', 'SeasonalDemand', 'RollingAvg7', 'RollingAvg30', 'SalesGrowthRate']
        X = df[feature_cols].copy()
        y = df['units_sold'].copy()
        
        # Standard scale numeric columns
        scaler = StandardScaler()
        scale_cols = ['SeasonalDemand', 'RollingAvg7', 'RollingAvg30', 'SalesGrowthRate']
        X[scale_cols] = scaler.fit_transform(X[scale_cols])
        
        # Split train/test (e.g. test is the last 6 months of 2025)
        test_start_date = pd.to_datetime('2025-07-01')
        train_mask = df['date'] < test_start_date
        test_mask = df['date'] >= test_start_date
        
        X_train, y_train = X[train_mask], y[train_mask]
        X_test, y_test = X[test_mask], y[test_mask]
        
        print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")
        
        # Train and compare models
        models = {
            "LinearRegression": LinearRegression(),
            "RandomForest": RandomForestRegressor(n_estimators=30, max_depth=6, random_state=42, n_jobs=-1),
            "GradientBoosting": GradientBoostingRegressor(n_estimators=30, max_depth=4, random_state=42)
        }
        
        best_rmse = float('inf')
        best_model_name = ""
        best_model = None
        results = {}
        
        for name, clf in models.items():
            print(f"Training {name}...")
            clf.fit(X_train, y_train)
            preds = clf.predict(X_test)
            
            # Clip predictions below zero
            preds = np.clip(preds, 0, None)
            
            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
            mae = float(mean_absolute_error(y_test, preds))
            r2 = float(r2_score(y_test, preds))
            
            results[name] = {"RMSE": rmse, "MAE": mae, "R2": r2}
            print(f"{name} Results - RMSE: {rmse:.4f}, MAE: {mae:.4f}, R2: {r2:.4f}")
            
            if rmse < best_rmse:
                best_rmse = rmse
                best_model_name = name
                best_model = clf
                
        print(f"Best model selected: {best_model_name} with RMSE: {best_rmse:.4f}")
        
        # Re-save last 30 days of actual sales per medicine to boot the forecasting rolling features
        recent_sales = {}
        for med in df['medicine'].unique():
            med_df = df[df['medicine'] == med].sort_values(by='date').tail(30)
            recent_sales[med] = med_df['units_sold'].tolist()
            
        # Save model and artifacts
        self.model = best_model
        self.label_encoder = le
        self.scaler = scaler
        self.seasonal_demand_map = seasonal_map
        self.recent_sales_history = recent_sales
        
        joblib.dump(best_model, self.model_path)
        joblib.dump({
            'label_encoder': le,
            'scaler': scaler,
            'seasonal_demand_map': seasonal_map,
            'recent_sales_history': recent_sales
        }, self.artifacts_path)
        
        self.metrics = {
            "best_model": best_model_name,
            "metrics": results[best_model_name],
            "all_models": results,
            "last_updated": datetime.now().isoformat()
        }
        
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metrics, f, indent=2)
            
        self.is_loaded = True
        return self.metrics

    def forecast_demand(self, medicine_name: str, current_stock: int) -> Dict[str, Any]:
        """
        Predicts demand for the next 30 days using recursive forecasting.
        """
        if not self.is_loaded or self.model is None:
            # Fallback placeholder forecasting if model is not trained yet
            # Let's return a sensible mock forecast based on average levels
            predicted_demand = 3500
            safety_stock = int(0.20 * predicted_demand)
            recommended_reorder = max(0, predicted_demand + safety_stock - current_stock)
            
            today = datetime.now()
            forecast_series = []
            for i in range(30):
                date_str = (today + timedelta(days=i)).strftime('%Y-%m-%d')
                # Add some simulated seasonality
                daily_val = 110 + int(20 * np.sin(2 * np.pi * i / 7))
                forecast_series.append({"date": date_str, "demand": daily_val})
                
            return {
                "medicine_name": medicine_name,
                "predicted_demand": predicted_demand,
                "safety_stock": safety_stock,
                "recommended_reorder": recommended_reorder,
                "confidence_score": 0.72,
                "forecast_series": forecast_series,
                "is_mock": True,
                "metrics": {"RMSE": 120.4, "MAE": 95.2, "R2": 0.75, "best_model": "RandomForest"}
            }
            
        try:
            # Map medicine name (if it's a brand name, map it to generic name)
            # Find closest matching generic name or fall back
            generic_name = medicine_name
            # The sales dataset contains these 10 medicines
            generics = ['Amlodipine', 'Vitamin C', 'Metformin', 'Azithromycin', 'Cough Syrup', 'Amoxicillin', 'Paracetamol', 'Multivitamin', 'Cetirizine', 'Ibuprofen']
            
            matched = False
            for gen in generics:
                if gen.lower() in medicine_name.lower():
                    generic_name = gen
                    matched = True
                    break
            
            # If no direct match, map based on keyword or fallback to Paracetamol
            if not matched:
                if "cough" in medicine_name.lower() or "syrup" in medicine_name.lower():
                    generic_name = "Cough Syrup"
                elif "vitamin c" in medicine_name.lower() or "limcee" in medicine_name.lower():
                    generic_name = "Vitamin C"
                elif "becosules" in medicine_name.lower() or "multivitamin" in medicine_name.lower():
                    generic_name = "Multivitamin"
                elif "augmentin" in medicine_name.lower() or "amoxy" in medicine_name.lower():
                    generic_name = "Amoxicillin"
                elif "azithral" in medicine_name.lower() or "azith" in medicine_name.lower():
                    generic_name = "Azithromycin"
                elif "calpol" in medicine_name.lower() or "crocin" in medicine_name.lower():
                    generic_name = "Paracetamol"
                elif "brufen" in medicine_name.lower() or "ibu" in medicine_name.lower():
                    generic_name = "Ibuprofen"
                elif "metformin" in medicine_name.lower() or "glycomet" in medicine_name.lower():
                    generic_name = "Metformin"
                elif "amlodipine" in medicine_name.lower() or "amlo" in medicine_name.lower():
                    generic_name = "Amlodipine"
                elif "cetirizine" in medicine_name.lower() or "aleri" in medicine_name.lower():
                    generic_name = "Cetirizine"
                else:
                    # Default generic fallback
                    generic_name = "Paracetamol"
            
            # Label encode
            med_encoded = int(self.label_encoder.transform([generic_name])[0])
            
            # Load last 30 days of history
            sales_history = list(self.recent_sales_history.get(generic_name, [100.0] * 30))
            
            predictions = []
            today = datetime.now()
            
            # Generate predictions day by day for 30 days
            for i in range(30):
                forecast_date = today + timedelta(days=i)
                month = forecast_date.month
                quarter = (month - 1) // 3 + 1
                day_of_week = forecast_date.weekday()
                
                # Fetch features
                seasonal_val = self.seasonal_demand_map.get((generic_name, month), 100.0)
                
                # Compute rolling features from sliding history window
                roll_7 = np.mean(sales_history[-7:])
                roll_30 = np.mean(sales_history[-30:])
                growth_rate = roll_7 / (roll_30 + 1e-5)
                
                # Setup raw feature array
                raw_features = pd.DataFrame([{
                    "MedicineEncoded": med_encoded,
                    "Month": month,
                    "Quarter": quarter,
                    "DayOfWeek": day_of_week,
                    "SeasonalDemand": seasonal_val,
                    "RollingAvg7": roll_7,
                    "RollingAvg30": roll_30,
                    "SalesGrowthRate": growth_rate
                }])
                
                # Scale numeric features
                scale_cols = ['SeasonalDemand', 'RollingAvg7', 'RollingAvg30', 'SalesGrowthRate']
                raw_features[scale_cols] = self.scaler.transform(raw_features[scale_cols])
                
                # Predict
                pred_val = float(self.model.predict(raw_features)[0])
                pred_val = max(0.0, pred_val)
                
                predictions.append(pred_val)
                sales_history.append(pred_val)
            
            # Calculate metrics
            predicted_demand = int(sum(predictions))
            safety_stock = int(0.20 * predicted_demand)
            recommended_reorder = max(0, predicted_demand + safety_stock - current_stock)
            
            # Dynamic forecast series for charting
            forecast_series = []
            for i, val in enumerate(predictions):
                date_str = (today + timedelta(days=i)).strftime('%Y-%m-%d')
                forecast_series.append({"date": date_str, "demand": int(val)})
                
            # Compute confidence score based on R2 score (clip to 0.4 - 0.95 range)
            r2 = self.metrics.get("metrics", {}).get("R2", 0.75)
            confidence_score = float(np.clip(r2, 0.40, 0.95))
            
            return {
                "medicine_name": medicine_name,
                "generic_name": generic_name,
                "predicted_demand": predicted_demand,
                "safety_stock": safety_stock,
                "recommended_reorder": recommended_reorder,
                "confidence_score": confidence_score,
                "forecast_series": forecast_series,
                "is_mock": False,
                "metrics": self.metrics.get("metrics", {}),
                "best_model": self.metrics.get("best_model", "RandomForest")
            }
            
        except Exception as e:
            # Fallback in case prediction fails
            print(f"Error forecasting for {medicine_name}: {str(e)}")
            predicted_demand = 3000
            safety_stock = int(0.20 * predicted_demand)
            recommended_reorder = max(0, predicted_demand + safety_stock - current_stock)
            return {
                "medicine_name": medicine_name,
                "predicted_demand": predicted_demand,
                "safety_stock": safety_stock,
                "recommended_reorder": recommended_reorder,
                "confidence_score": 0.50,
                "is_mock": True,
                "error": str(e)
            }

ml_engine = MLEngine()
if __name__ == "__main__":
    # Test script if run directly
    try:
        metrics = ml_engine.train_pipeline()
        print("Training succeeded. Metrics:")
        print(metrics)
    except Exception as ex:
        print(f"Training failed: {ex}")
