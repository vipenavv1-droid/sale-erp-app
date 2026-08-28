import React, { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../supabaseClient';

function Items({ items, fetchAllData }) {
  const [itemNameInput, setItemNameInput] = useState('');
  const [itemQtyInput, setItemQtyInput] = useState('');
  const [itemPriceInput, setItemPriceInput] = useState('');

  const handleAddItem = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('items').insert([{ 
      item_name: itemNameInput, 
      qty: parseInt(itemQtyInput) || 0,
      price: parseFloat(itemPriceInput) || 0 
    }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setItemNameInput(''); setItemQtyInput(''); setItemPriceInput('');
      fetchAllData();
    }
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        await supabase.from('items').insert(results.data);
        fetchAllData();
      }
    });
  };

  return (
    <div>
      <h1 className="header-title">Item Inventory</h1>
      <div className="card">
        <h2 className="card-title">Add New Item</h2>
        <form onSubmit={handleAddItem} className="form-grid">
          <div className="form-group">
            <label>Item Name</label>
            <input className="form-control" placeholder="Dell Laptop" value={itemNameInput} onChange={(e) => setItemNameInput(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input className="form-control" type="number" placeholder="10" value={itemQtyInput} onChange={(e) => setItemQtyInput(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Unit Price (₹)</label>
            <input className="form-control" type="number" placeholder="45000" value={itemPriceInput} onChange={(e) => setItemPriceInput(e.target.value)} required />
          </div>
          <div className="form-group full-width">
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Save Item</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">
          <span>Inventory Items</span>
          <label className="btn btn-primary" style={{ background: '#475569', fontSize: '12px', cursor: 'pointer' }}>
            <Upload size={14} /> Bulk Import CSV
            <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
          </label>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr><th>Item Name</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td><strong>{it.item_name}</strong></td>
                  <td>{it.qty}</td>
                  <td>₹{it.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Items;