import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';

function SalesInvoice({ customers, items, fetchAllData }) {
  const [customer, setCustomer] = useState('');
  const [district, setDistrict] = useState('');
  const [invoiceType, setInvoiceType] = useState('Retail');
  const [productType, setProductType] = useState('');
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');

  // Customer സെലക്ട് ചെയ്യുമ്പോൾ District താനേ വരാൻ
  const handleCustomerChange = (e) => {
    const selectedCustName = e.target.value;
    setCustomer(selectedCustName);
    const custObj = customers.find(c => c.name === selectedCustName);
    if (custObj) {
      setDistrict(custObj.district || '');
    } else {
      setDistrict('');
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase.from('invoices').insert([
      { 
        customer_name: customer, 
        district: district,
        invoice_type: invoiceType, 
        product_type: productType,
        item_name: product, 
        invoiced_amount: parseFloat(amount), 
        paid_amount: 0 
      }
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Invoice Created Successfully!");
      setCustomer(''); setDistrict(''); setInvoiceType('Retail'); setProductType(''); setProduct(''); setAmount('');
      fetchAllData();
    }
  };

  return (
    <div>
      <h1 className="header-title">Sales Invoice</h1>
      <div className="card" style={{ maxWidth: '650px' }}>
        <h2 className="card-title">Generate Invoice</h2>
        <form onSubmit={handleAddInvoice} className="form-grid">
          
          {/* 1. Customer Selection */}
          <div className="form-group">
            <label>Select Customer</label>
            <select className="form-control" value={customer} onChange={handleCustomerChange} required>
              <option value="">-- Choose Customer --</option>
              {customers.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* 2. District Field */}
          <div className="form-group">
            <label>District</label>
            <input className="form-control" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District Name" required />
          </div>

          {/* 3. Invoice Type Field */}
          <div className="form-group">
            <label>Invoice Type</label>
            <select className="form-control" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} required>
              <option value="Retail">Retail Sale</option>
              <option value="B2B">B2B (Tax Invoice)</option>
              <option value="Wholesale">Wholesale Sale</option>
            </select>
          </div>

          {/* 4. Product Type Field */}
          <div className="form-group">
            <label>Product Type / Category</label>
            <input className="form-control" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="e.g. Electronics, Hardware" required />
          </div>

          {/* 5. Product (Item Name) Selection */}
          <div className="form-group">
            <label>Select Product (Item)</label>
            <select className="form-control" value={product} onChange={(e) => {
              setProduct(e.target.value);
              const selected = items.find(i => i.item_name === e.target.value);
              if (selected) setAmount(selected.price);
            }} required>
              <option value="">-- Choose Product --</option>
              {items.map((it, i) => <option key={i} value={it.item_name}>{it.item_name}</option>)}
            </select>
          </div>

          {/* 6. Invoice Amount */}
          <div className="form-group">
            <label>Invoice Amount (₹)</label>
            <input className="form-control" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>

          <div className="form-group full-width">
            <button type="submit" className="btn btn-primary"><FileText size={16} /> Create & Save Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SalesInvoice;