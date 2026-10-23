import os
import io
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.database.connection import db

class ReportingService:
    def __init__(self):
        pass

    def generate_sales_pdf(self) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()
        
        # Header Style
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563EB'), # Medical blue
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            name='SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=30
        )
        normal_style = styles['Normal']
        bold_style = ParagraphStyle(
            name='BoldStyle',
            parent=normal_style,
            fontName='Helvetica-Bold'
        )

        # Title
        story.append(Paragraph("SMART PHARMACY MANAGEMENT SYSTEM", title_style))
        story.append(Paragraph(f"Sales Report - Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
        
        # Load Sales data
        sales = db.get_all("sales")
        # Sort sales by date desc
        sales = sorted(sales, key=lambda x: x.get("sale_date", ""), reverse=True)
        
        # Calculate stats
        total_revenue = sum(s.get("revenue", 0.0) for s in sales)
        total_items = sum(s.get("quantity", 0) for s in sales)
        avg_trans = total_revenue / len(sales) if sales else 0.0
        
        # KPI Block
        kpi_data = [
            [
                Paragraph("<b>Total Transactions</b>", normal_style),
                Paragraph("<b>Total Units Sold</b>", normal_style),
                Paragraph("<b>Total Revenue</b>", normal_style),
                Paragraph("<b>Avg Order Value</b>", normal_style)
            ],
            [
                Paragraph(str(len(sales)), bold_style),
                Paragraph(str(total_items), bold_style),
                Paragraph(f"INR {total_revenue:,.2f}", bold_style),
                Paragraph(f"INR {avg_trans:,.2f}", bold_style)
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[120, 120, 140, 120])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 25))
        
        # Sales Table
        story.append(Paragraph("<b>Recent Transactions</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        table_data = [[
            Paragraph("<b>Sale ID</b>", bold_style),
            Paragraph("<b>Medicine</b>", bold_style),
            Paragraph("<b>Category</b>", bold_style),
            Paragraph("<b>Qty</b>", bold_style),
            Paragraph("<b>Date</b>", bold_style),
            Paragraph("<b>Revenue</b>", bold_style)
        ]]
        
        for sale in sales[:30]: # Limit to last 30 for PDF readability
            table_data.append([
                Paragraph(sale.get("sale_id", ""), normal_style),
                Paragraph(sale.get("medicine_name", ""), normal_style),
                Paragraph(sale.get("category", ""), normal_style),
                Paragraph(str(sale.get("quantity", 0)), normal_style),
                Paragraph(sale.get("sale_date", "")[:10], normal_style),
                Paragraph(f"INR {sale.get('revenue', 0.0):.2f}", normal_style)
            ])
            
        sales_table = Table(table_data, colWidths=[70, 130, 90, 40, 90, 90])
        sales_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(sales_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_inventory_pdf(self) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#14B8A6'), # Secondary teal
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            name='SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=30
        )
        normal_style = styles['Normal']
        bold_style = ParagraphStyle(
            name='BoldStyle',
            parent=normal_style,
            fontName='Helvetica-Bold'
        )
        
        story.append(Paragraph("SMART PHARMACY MANAGEMENT SYSTEM", title_style))
        story.append(Paragraph(f"Inventory Stock Report - Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
        
        # Load medicines & stock
        medicines = db.get_all("medicines")
        inventory = db.get_all("inventory")
        inv_map = {item["medicine_id"]: item for item in inventory}
        
        # Calculations
        total_meds = len(medicines)
        total_stock = sum(item.get("current_stock", 0) for item in inventory)
        total_value = sum(
            inv_map.get(m["medicine_id"], {}).get("current_stock", 0) * m.get("price", 0.0) 
            for m in medicines
        )
        low_stock_count = sum(
            1 for m in medicines 
            if inv_map.get(m["medicine_id"], {}).get("current_stock", 0) < m.get("reorder_level", 0)
        )
        
        # KPI Block
        kpi_data = [
            [
                Paragraph("<b>Total Medicines</b>", normal_style),
                Paragraph("<b>Total Stock Qty</b>", normal_style),
                Paragraph("<b>Total Inventory Value</b>", normal_style),
                Paragraph("<b>Low Stock Items</b>", normal_style)
            ],
            [
                Paragraph(str(total_meds), bold_style),
                Paragraph(str(total_stock), bold_style),
                Paragraph(f"INR {total_value:,.2f}", bold_style),
                Paragraph(str(low_stock_count), bold_style)
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[120, 120, 140, 120])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 25))
        
        # Stock Table
        story.append(Paragraph("<b>Stock Status Details</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        table_data = [[
            Paragraph("<b>Med ID</b>", bold_style),
            Paragraph("<b>Medicine Name</b>", bold_style),
            Paragraph("<b>Category</b>", bold_style),
            Paragraph("<b>Price</b>", bold_style),
            Paragraph("<b>Stock</b>", bold_style),
            Paragraph("<b>Status</b>", bold_style)
        ]]
        
        for med in medicines:
            med_id = med["medicine_id"]
            stock = inv_map.get(med_id, {}).get("current_stock", 0)
            reorder = med.get("reorder_level", 0)
            
            # Status check
            if stock < reorder * 0.5:
                status_text = "<font color='red'>CRITICAL</font>"
            elif stock < reorder:
                status_text = "<font color='orange'>LOW STOCK</font>"
            else:
                status_text = "<font color='green'>OK</font>"
                
            table_data.append([
                Paragraph(med_id, normal_style),
                Paragraph(med.get("name", ""), normal_style),
                Paragraph(med.get("category", ""), normal_style),
                Paragraph(f"INR {med.get('price', 0.0):.2f}", normal_style),
                Paragraph(str(stock), normal_style),
                Paragraph(status_text, normal_style)
            ])
            
        inv_table = Table(table_data, colWidths=[65, 160, 90, 65, 50, 80])
        inv_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#14B8A6')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(inv_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_forecast_pdf(self) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563EB'),
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            name='SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=30
        )
        normal_style = styles['Normal']
        bold_style = ParagraphStyle(
            name='BoldStyle',
            parent=normal_style,
            fontName='Helvetica-Bold'
        )
        
        story.append(Paragraph("SMART PHARMACY MANAGEMENT SYSTEM", title_style))
        story.append(Paragraph(f"Demand Forecast & Reorder Prediction Report - Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
        
        # Load medicines & forecasts
        medicines = db.get_all("medicines")
        forecasts = db.get_all("forecasts")
        frc_map = {f["medicine_id"]: f for f in forecasts}
        
        # Summary description
        story.append(Paragraph("<b>AI forecasting and reorder predictions:</b> The system estimates the next 30 days of sales demand using machine learning. Safety Stock is set to 20% of predicted demand. Reorder quantity is calculated as: <i>Predicted Demand + Safety Stock - Current Stock</i>.", normal_style))
        story.append(Spacer(1, 15))
        
        # Table of predictions
        table_data = [[
            Paragraph("<b>Medicine</b>", bold_style),
            Paragraph("<b>Category</b>", bold_style),
            Paragraph("<b>Predicted Demand</b>", bold_style),
            Paragraph("<b>Safety Stock</b>", bold_style),
            Paragraph("<b>Recommended Reorder</b>", bold_style),
            Paragraph("<b>Confidence</b>", bold_style)
        ]]
        
        for med in medicines:
            med_id = med["medicine_id"]
            frc = frc_map.get(med_id, {})
            
            pred = frc.get("predicted_demand", 0)
            safety = frc.get("safety_stock", int(pred * 0.20))
            reorder = frc.get("recommended_reorder", 0)
            conf = frc.get("confidence_score", 0.75)
            
            table_data.append([
                Paragraph(med.get("name", ""), normal_style),
                Paragraph(med.get("category", ""), normal_style),
                Paragraph(f"{pred} units", normal_style),
                Paragraph(f"{safety} units", normal_style),
                Paragraph(f"<b>{reorder} units</b>" if reorder > 0 else "0 (Adequate Stock)", normal_style),
                Paragraph(f"{conf*100:.1f}%", normal_style)
            ])
            
        frc_table = Table(table_data, colWidths=[150, 90, 75, 75, 100, 60])
        frc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(frc_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    def export_inventory_excel(self) -> io.BytesIO:
        buffer = io.BytesIO()
        medicines = db.get_all("medicines")
        inventory = db.get_all("inventory")
        suppliers = db.get_all("suppliers")
        
        inv_map = {item["medicine_id"]: item for item in inventory}
        sup_map = {item["supplier_id"]: item.get("supplier_name", "") for item in suppliers}
        
        records = []
        for med in medicines:
            med_id = med["medicine_id"]
            inv = inv_map.get(med_id, {})
            records.append({
                "Medicine ID": med_id,
                "Name": med.get("name", ""),
                "Generic Name": med.get("generic_name", ""),
                "Category": med.get("category", ""),
                "Manufacturer": med.get("manufacturer", ""),
                "Batch Number": med.get("batch_no", ""),
                "Cost Price (INR)": med.get("cost_price", 0.0),
                "Sale Price (INR)": med.get("price", 0.0),
                "Current Stock": inv.get("current_stock", 0),
                "Reserved Stock": inv.get("reserved_stock", 0),
                "Available Stock": inv.get("available_stock", 0),
                "Reorder Level": med.get("reorder_level", 0),
                "Expiry Date": med.get("expiry_date", ""),
                "Supplier": sup_map.get(med.get("supplier_id", ""), "Unknown"),
                "Created At": med.get("created_at", "")
            })
            
        df = pd.DataFrame(records)
        try:
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Inventory Status')
        except Exception:
            # Fallback to CSV format if excel engine fails
            csv_str = df.to_csv(index=False)
            buffer.write(csv_str.encode('utf-8'))
            
        buffer.seek(0)
        return buffer

    def export_sales_excel(self) -> io.BytesIO:
        buffer = io.BytesIO()
        sales = db.get_all("sales")
        
        records = []
        for s in sales:
            records.append({
                "Transaction ID": s.get("sale_id", ""),
                "Medicine ID": s.get("medicine_id", ""),
                "Medicine Name": s.get("medicine_name", ""),
                "Category": s.get("category", ""),
                "Quantity": s.get("quantity", 0),
                "Revenue (INR)": s.get("revenue", 0.0),
                "Sale Date": s.get("sale_date", "")
            })
            
        df = pd.DataFrame(records)
        try:
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Sales Transactions')
        except Exception:
            # Fallback to CSV format if excel engine fails
            csv_str = df.to_csv(index=False)
            buffer.write(csv_str.encode('utf-8'))
            
        buffer.seek(0)
        return buffer

reporting_service = ReportingService()
