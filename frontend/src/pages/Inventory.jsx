import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Edit2, Trash2, Filter, 
  ChevronLeft, ChevronRight, Calendar, Boxes 
} from 'lucide-react';

const Inventory = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMed, setCurrentMed] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: 'Antibiotic',
    manufacturer: '',
    batch_no: '',
    price: '',
    cost_price: '',
    supplier_id: '',
    reorder_level: 500,
    expiry_date: '',
    initial_stock: 100
  });

  const isReadOnly = user?.role === 'pharmacist';

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory');
      setMedicines(res.data);
    } catch (err) {
      console.error("Error fetching inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('/suppliers');
      setSuppliers(res.data);
      if (res.data.length > 0 && !formData.supplier_id) {
        setFormData(prev => ({ ...prev, supplier_id: res.data[0].supplier_id }));
      }
    } catch (err) {
      console.error("Error fetching suppliers", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        reorder_level: parseInt(formData.reorder_level),
        initial_stock: parseInt(formData.initial_stock)
      };
      await axios.post('/inventory', payload);
      setShowAddModal(false);
      resetForm();
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.detail || "Error adding medicine");
    }
  };

  const handleEditClick = (med) => {
    setCurrentMed(med);
    setFormData({
      name: med.name,
      generic_name: med.generic_name,
      category: med.category,
      manufacturer: med.manufacturer,
      batch_no: med.batch_no,
      price: med.price,
      cost_price: med.cost_price,
      supplier_id: med.supplier_id,
      reorder_level: med.reorder_level,
      expiry_date: med.expiry_date,
      current_stock: med.current_stock
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        generic_name: formData.generic_name,
        category: formData.category,
        manufacturer: formData.manufacturer,
        batch_no: formData.batch_no,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        supplier_id: formData.supplier_id,
        reorder_level: parseInt(formData.reorder_level),
        expiry_date: formData.expiry_date,
        current_stock: parseInt(formData.current_stock)
      };
      await axios.put(`/inventory/${currentMed.medicine_id}`, payload);
      setShowEditModal(false);
      resetForm();
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.detail || "Error updating medicine");
    }
  };

  const handleDeleteClick = async (medId) => {
    if (window.confirm("Are you sure you want to delete this medicine and all its stock records?")) {
      try {
        await axios.delete(`/inventory/${medId}`);
        fetchInventory();
      } catch (err) {
        alert(err.response?.data?.detail || "Error deleting medicine");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      category: 'Antibiotic',
      manufacturer: '',
      batch_no: '',
      price: '',
      cost_price: '',
      supplier_id: suppliers[0]?.supplier_id || '',
      reorder_level: 500,
      expiry_date: '',
      initial_stock: 100
    });
    setCurrentMed(null);
  };

  // Filter medicines
  const filteredMeds = medicines.filter(med => {
    const matchesSearch = 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.batch_no.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    const matchesSupplier = selectedSupplier === 'All' || med.supplier_id === selectedSupplier;

    let matchesStock = true;
    if (selectedStockStatus === 'Low') {
      matchesStock = med.current_stock < med.reorder_level && med.current_stock >= (med.reorder_level * 0.5);
    } else if (selectedStockStatus === 'Critical') {
      matchesStock = med.current_stock < (med.reorder_level * 0.5);
    } else if (selectedStockStatus === 'Normal') {
      matchesStock = med.current_stock >= med.reorder_level;
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
  });

  // Categories
  const categories = ['Antibiotic', 'Chronic', 'Vitamin', 'Cough_Cold', 'Antipyretic'];

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMeds.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMeds.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="ml-3 font-bold text-slate-500">Loading Inventory Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white">Inventory Master</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Track and manage medicine stocks, pricing, batches, and suppliers</p>
        </div>

        {isReadOnly ? (
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            Read-Only view
          </span>
        ) : (
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Medicine</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Search size={16} /></span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by name, generic, or batch..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs font-semibold dark:text-white"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-1">
            <Filter size={12} className="text-slate-400" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Filters</span>
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold dark:text-white outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Stock Status */}
          <select
            value={selectedStockStatus}
            onChange={(e) => { setSelectedStockStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold dark:text-white outline-none"
          >
            <option value="All">All Stock Levels</option>
            <option value="Normal">Adequate Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Critical">Critical Stock</option>
          </select>

          {/* Supplier */}
          <select
            value={selectedSupplier}
            onChange={(e) => { setSelectedSupplier(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold dark:text-white outline-none"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200/50 dark:border-slate-800/50">
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Medicine Name</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Generic Name</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Category</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Batch No</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Supplier</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Available Stock</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Unit Price</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Expiry</th>
                {!isReadOnly && <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/30">
              {currentItems.map(med => {
                const stock = med.current_stock;
                const reorder = med.reorder_level;
                
                let stockColor = "text-slate-700 dark:text-slate-200";
                let stockBg = "bg-slate-100 dark:bg-slate-800";
                
                if (stock < reorder * 0.5) {
                  stockColor = "text-danger";
                  stockBg = "bg-red-500/10";
                } else if (stock < reorder) {
                  stockColor = "text-warning";
                  stockBg = "bg-amber-500/10";
                } else {
                  stockColor = "text-success";
                  stockBg = "bg-emerald-500/10";
                }

                return (
                  <tr key={med.medicine_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <td className="p-4">
                      <div>
                        <p className="font-bold dark:text-white text-sm">{med.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{med.manufacturer}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-500 dark:text-slate-400">{med.generic_name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-extrabold">{med.category}</span>
                    </td>
                    <td className="p-4 font-mono font-bold">{med.batch_no}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={med.supplier_name}>
                      {med.supplier_name}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg ${stockBg} ${stockColor} font-bold`}>
                        {stock} / {reorder}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">₹{med.price.toFixed(2)}</td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{med.expiry_date}</td>
                    {!isReadOnly && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(med)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-slate-500 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(med.medicine_id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-danger hover:text-white text-slate-500 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredMeds.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 9} className="p-8 text-center text-slate-400 text-xs">
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMeds.length)} of {filteredMeds.length}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black dark:text-white">{currentPage} / {totalPages}</span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg glass-card border border-white/10 dark:text-white rounded-3xl p-6 shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-extrabold mb-4">{showAddModal ? 'Add New Medicine' : 'Edit Medicine Details'}</h3>
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Calpol 650 Duo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Generic Name</label>
                  <input
                    type="text"
                    required
                    name="generic_name"
                    value={formData.generic_name}
                    onChange={handleInputChange}
                    placeholder="Paracetamol"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="GSK Pharmaceuticals"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    name="batch_no"
                    value={formData.batch_no}
                    onChange={handleInputChange}
                    placeholder="B2026-PA01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    placeholder="25.50"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="35.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Reorder Lvl</label>
                  <input
                    type="number"
                    required
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleInputChange}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Supplier</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  >
                    {suppliers.map(s => (
                      <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    {showAddModal ? 'Initial Stock' : 'Current Stock'}
                  </label>
                  <input
                    type="number"
                    required
                    name={showAddModal ? "initial_stock" : "current_stock"}
                    value={showAddModal ? formData.initial_stock : formData.current_stock}
                    onChange={handleInputChange}
                    placeholder="200"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/30">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 text-slate-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
