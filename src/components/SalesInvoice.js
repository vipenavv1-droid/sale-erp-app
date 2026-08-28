import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { supabase } from '../App';

// Date Format Helper
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Currency Format Helper
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(num);
};

// Invoice Types Rules & Allowed Item Types Config
const INVOICE_CONFIG = {
  RPCD: { label: 'RPCD (3 Days)', days: 3, allowedItems: ['JSW', 'Tiger TMT', 'Kalinga', 'Others'] },
  RPCD60: { label: 'RPCD60 (14 Days)', days: 14, allowedItems: ['JSW', 'Tiger TMT', 'Kalinga', 'Others'] },
  RP: { label: 'RP (30 Days)', days: 30, allowedItems: ['JSW', 'Tiger TMT', 'Kalinga', 'Others'] },
  RPJ: { label: 'RPJ (3 Days)', days: 3, allowedItems: ['JSW', 'Others'] },
  PJ: { label: 'PJ (3 Days)', days: 3, allowedItems: ['JSW', 'Others'] }
};

function SalesInvoice({ customers = [], invoices = [], fetchAllData }) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customer, setCustomer] = useState('');
  const [district, setDistrict] = useState('');
  const [invoiceType, setInvoiceType] = useState(''); // Default Empty for '-- Select --'
  const [itemType, setItemType] = useState('');
  const [customItemType, setCustomItemType] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [freight, setFreight] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Available item options based on selected Invoice Type
  const currentAllowedItems = invoiceType ? (INVOICE_CONFIG[invoiceType]?.allowedItems || []) : [];

  // Handle Invoice Type Change
  const handleInvoiceTypeChange = (e) => {
    const selectedType = e.target.value;
    setInvoiceType(selectedType);

    // Reset itemType if current selection is not valid for the new invoice type
    if (selectedType) {
      const allowed = INVOICE_CONFIG[selectedType]?.allowedItems || [];
      if (!allowed.includes(itemType)) {
        setItemType('');
        setCustomItemType('');
      }
    } else {
      setItemType('');
      setCustomItemType('');
    }
  };

  // Calculate Due Date based on Customer's Credit Period or Invoice Type
  const calculateDueDate = (dateStr, type, custName) => {
    if (!dateStr) return;
    
    let daysToAdd = 0;
    const custObj = (customers || []).find(c => c.name === custName);

    if (custObj && custObj.credit_period) {
      daysToAdd = parseInt(custObj.credit_period, 10) || 0;
    } else if (type && INVOICE_CONFIG[type]) {
      daysToAdd = INVOICE_CONFIG[type].days;
    } else {
      setDueDate('');
      return;
    }

    const resultDate = new Date(dateStr);
    resultDate.setDate(resultDate.getDate() + daysToAdd);
    setDueDate(resultDate.toISOString().split('T')[0]);
  };

  useEffect(() => {
    calculateDueDate(invoiceDate, invoiceType, customer);
  }, [invoiceDate, invoiceType, customer]);

  const handleCustomerChange = (e) => {
    const selectedCustName = e.target.value;
    setCustomer(selectedCustName);
    const custObj = (customers || []).find(c => c.name === selectedCustName);
    setDistrict(custObj ? (custObj.district || '') : '');
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();

    if (!invoiceType) {
      alert("Please select an Invoice Type!");
      return;
    }

    const finalItemType = itemType === 'Others' ? customItemType : itemType;

    if (!finalItemType) {
      alert("Please select or enter an Item Type!");
      return;
    }

    const itemAmt = parseFloat(invoiceAmount) || 0;
    const freightAmt = parseFloat(freight) || 0;
    
    // Total Invoiced Amount = Invoice Amount - Freight Charge
    const totalInvoicedAmount = itemAmt - freightAmt;

    const { error } = await supabase.from('invoices').insert([
      { 
        invoice_no: invoiceNumber,
        invoice_date: invoiceDate,
        customer_name: customer, 
        district: district,
        invoice_type: invoiceType, 
        item_type: finalItemType,
        invoiced_amount: totalInvoicedAmount,
        freight: freightAmt,
        due_date: dueDate,
        paid_amount: 0 
      }
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Invoice Created Successfully!");
      setInvoiceNumber('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setCustomer(''); 
      setDistrict(''); 
      setInvoiceType(''); 
      setItemType(''); 
      setCustomItemType('');
      setInvoiceAmount(''); 
      setFreight('');
      setDueDate('');
      if (fetchAllData) fetchAllData();
    }
  };

  return (
    <div>
      <h1 className="header-title">Sales Invoice</h1>
      
      {/* Form Section */}
      <div className="card" style={{ maxWidth: '650px', marginBottom: '30px' }}>
        <h2 className="card-title">Generate Invoice</h2>
        <form onSubmit={handleAddInvoice} className="form-grid">
          
          <div className="form-group">
            <label>Invoice Number</label>
            <input 
              className="form-control" 
              value={invoiceNumber} 
              onChange={(e) => setInvoiceNumber(e.target.value)} 
              placeholder="e.g. INV-001" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Invoice Date</label>
            <input 
              className="form-control" 
              type="date" 
              value={invoiceDate} 
              onChange={(e) => setInvoiceDate(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Customer</label>
            <select className="form-control" value={customer} onChange={handleCustomerChange} required>
              <option value="">-- Choose Customer --</option>
              {(customers || []).map((c, i) => (
                <option key={i} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>District</label>
            <input className="form-control" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" required />
          </div>

          {/* Invoice Type Selection */}
          <div className="form-group">
            <label>Invoice Type</label>
            <select 
              className="form-control" 
              value={invoiceType} 
              onChange={handleInvoiceTypeChange} 
              required
            >
              <option value="">-- Select Invoice Type --</option>
              {Object.keys(INVOICE_CONFIG).map((key) => (
                <option key={key} value={key}>
                  {INVOICE_CONFIG[key].label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Item Type Selection */}
          <div className="form-group">
            <label>Item Type</label>
            <select 
              className="form-control" 
              value={itemType} 
              onChange={(e) => setItemType(e.target.value)} 
              disabled={!invoiceType}
              required
            >
              <option value="">-- Select Item Type --</option>
              {currentAllowedItems.map((type, i) => (
                <option key={i} value={type}>
                  {type === 'Others' ? 'Others (Specify)' : type}
                </option>
              ))}
            </select>
          </div>

          {itemType === 'Others' && (
            <div className="form-group">
              <label>Specify Item Type</label>
              <input 
                className="form-control" 
                value={customItemType} 
                onChange={(e) => setCustomItemType(e.target.value)} 
                placeholder="Enter Item Type" 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label>Invoice Amount (₹)</label>
            <input className="form-control" type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="0.00" required />
          </div>

          <div className="form-group">
            <label>Freight Charge (₹)</label>
            <input className="form-control" type="number" value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0.00" />
          </div>

          <div className="form-group full-width">
            <label>Due Date (Calculated Automatically)</label>
            <input className="form-control" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required readOnly />
          </div>

          <div className="form-group full-width">
            <button type="submit" className="btn btn-primary">
              <FileText size={16} /> Create & Save Invoice
            </button>
          </div>
        </form>
      </div>

      {/* Saved Invoices List Table */}
      <div className="card">
        <h2 className="card-title">Saved Invoices List</h2>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>District</th>
                <th>Inv No</th>
                <th>Inv Date</th>
                <th>Invoice Type</th>
                <th>Item Type</th>
                <th>Freight</th>
                <th>Total Bill</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {(!invoices || invoices.length === 0) ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#64748b' }}>No invoices saved yet.</td>
                </tr>
              ) : (
                (invoices || []).slice().reverse().map((inv, i) => (
                  <tr key={inv.id || i}>
                    <td><strong>{inv.customer_name}</strong></td>
                    <td>{inv.district || '-'}</td>
                    <td><strong>{inv.invoice_no || '-'}</strong></td>
                    <td>{formatDate(inv.invoice_date)}</td>
                    <td>{inv.invoice_type || '-'}</td>
                    <td>{inv.item_type || '-'}</td>
                    <td>{formatCurrency(inv.freight)}</td>
                    <td><strong>{formatCurrency(inv.invoiced_amount)}</strong></td>
                    <td>{formatDate(inv.due_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesInvoice;