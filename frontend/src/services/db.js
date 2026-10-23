import { 
  collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, addDoc 
} from 'firebase/firestore';
import { firestore } from './firebase';

export const getMedicines = async () => {
  const medsSnapshot = await getDocs(collection(firestore, "medicines"));
  const invSnapshot = await getDocs(collection(firestore, "inventory"));
  const supSnapshot = await getDocs(collection(firestore, "suppliers"));

  const invMap = {};
  invSnapshot.forEach(d => {
    invMap[d.data().medicine_id] = d.data();
  });

  const supMap = {};
  supSnapshot.forEach(d => {
    supMap[d.data().supplier_id] = d.data().supplier_name;
  });

  const result = [];
  medsSnapshot.forEach(d => {
    const med = d.data();
    const inv = invMap[med.medicine_id] || {};
    result.append ? null : result.push({
      ...med,
      supplier_name: supMap[med.supplier_id] || "Unknown Supplier",
      current_stock: inv.current_stock || 0,
      reserved_stock: inv.reserved_stock || 0,
      available_stock: inv.available_stock || 0,
      last_updated: inv.last_updated || ""
    });
  });
  return result;
};

export const addMedicine = async (medData) => {
  const medId = `med_${Math.random().toString(36).substring(2, 10)}`;
  const timestamp = new Date().toISOString();

  const medicineDoc = {
    medicine_id: medId,
    name: medData.name,
    generic_name: medData.generic_name,
    category: medData.category,
    manufacturer: medData.manufacturer,
    batch_no: medData.batch_no,
    price: medData.price,
    cost_price: medData.cost_price,
    supplier_id: medData.supplier_id,
    reorder_level: medData.reorder_level,
    expiry_date: medData.expiry_date,
    created_at: timestamp
  };

  const inventoryDoc = {
    inventory_id: `inv_${medId}`,
    medicine_id: medId,
    current_stock: medData.initial_stock,
    reserved_stock: 0,
    available_stock: medData.initial_stock,
    last_updated: timestamp
  };

  await setDoc(doc(firestore, "medicines", medId), medicineDoc);
  await setDoc(doc(firestore, "inventory", `inv_${medId}`), inventoryDoc);
  return medId;
};

export const updateMedicine = async (medId, medData) => {
  const medRef = doc(firestore, "medicines", medId);
  const invRef = doc(firestore, "inventory", `inv_${medId}`);

  const medUpdate = {};
  const fields = ["name", "generic_name", "category", "manufacturer", "batch_no", "price", "cost_price", "supplier_id", "reorder_level", "expiry_date"];
  fields.forEach(f => {
    if (medData[f] !== undefined) medUpdate[f] = medData[f];
  });

  if (Object.keys(medUpdate).length > 0) {
    await updateDoc(medRef, medUpdate);
  }

  if (medData.current_stock !== undefined) {
    const invSnap = await getDoc(invRef);
    if (invSnap.exists()) {
      const reserved = invSnap.data().reserved_stock || 0;
      await updateDoc(invRef, {
        current_stock: medData.current_stock,
        available_stock: medData.current_stock - reserved,
        last_updated: new Date().toISOString()
      });
    }
  }
};

export const deleteMedicine = async (medId) => {
  await deleteDoc(doc(firestore, "medicines", medId));
  await deleteDoc(doc(firestore, "inventory", `inv_${medId}`));
  await deleteDoc(doc(firestore, "forecasts", `forc_${medId}`));
};

export const getSales = async () => {
  const snapshot = await getDocs(collection(firestore, "sales"));
  const sales = [];
  snapshot.forEach(d => sales.push(d.data()));
  return sales.sort((a, b) => b.sale_date.localeCompare(a.sale_date));
};

export const recordSale = async (medId, qty) => {
  const medSnap = await getDoc(doc(firestore, "medicines", medId));
  const invRef = doc(firestore, "inventory", `inv_${medId}`);
  const invSnap = await getDoc(invRef);

  if (!medSnap.exists() || !invSnap.exists()) {
    throw new Error("Medicine or inventory stock record not found.");
  }

  const med = medSnap.data();
  const inv = invSnap.data();

  if (inv.available_stock < qty) {
    throw new Error(`Insufficient stock. Available: ${inv.available_stock}, Requested: ${qty}`);
  }

  const newCurrent = inv.current_stock - qty;
  const newAvail = inv.available_stock - qty;

  await updateDoc(invRef, {
    current_stock: newCurrent,
    available_stock: newAvail,
    last_updated: new Date().toISOString()
  });

  const saleId = `sale_${Math.random().toString(36).substring(2, 10)}`;
  const revenue = Number((qty * med.price).toFixed(2));
  
  const saleDoc = {
    sale_id: saleId,
    medicine_id: medId,
    medicine_name: med.name,
    category: med.category,
    quantity: qty,
    sale_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    revenue: revenue
  };

  await setDoc(doc(firestore, "sales", saleId), saleDoc);
  return saleDoc;
};

export const getSuppliers = async () => {
  const snapshot = await getDocs(collection(firestore, "suppliers"));
  const result = [];
  snapshot.forEach(d => result.push(d.data()));
  return result;
};

export const addSupplier = async (supplierData) => {
  const supId = `sup_${Math.random().toString(36).substring(2, 10)}`;
  const docData = {
    supplier_id: supId,
    supplier_name: supplierData.supplier_name,
    contact: supplierData.contact || "",
    email: supplierData.email || "",
    address: supplierData.address || ""
  };
  await setDoc(doc(firestore, "suppliers", supId), docData);
  return supId;
};

export const getAuditLogs = async () => {
  const snapshot = await getDocs(collection(firestore, "audit_logs"));
  const logs = [];
  snapshot.forEach(d => logs.push(d.data()));
  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

export const addAuditLog = async (action, userEmail, details) => {
  const logId = `audit_${Math.random().toString(36).substring(2, 10)}`;
  const logData = {
    log_id: logId,
    action: action,
    user: userEmail,
    timestamp: new Date().toISOString(),
    details: details
  };
  await setDoc(doc(firestore, "audit_logs", logId), logData);
};
