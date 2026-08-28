import React, { useState } from 'react';
import { Download, Filter } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(num);
};

// Invoice ethra days aayi (Age) calculate cheyyunna helper function
const calculateAgeInDays = (invoiceDate) => {
  if (!invoiceDate) return 0;
  const created = new Date(invoiceDate);
  const today = new Date();
  
  // Time reset to start of day for exact day calculation
  created.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - created;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
};

// Overdue status check helper function
const getStatusBadge = (dueDateStr, balance) => {
  if (balance <= 0) {
    return <span className="badge badge-success">Fully Paid</span>;
  }
  if (!dueDateStr) {
    return <span className="badge badge-danger">Pending</span>;
  }

  const today = new Date();
  const due = new Date(dueDateStr);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = today - due;
  const overDueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (overDueDays > 0) {
    return <span className="badge badge-danger">Overdue ({overDueDays} Days)</span>;
  }
  return <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#d97706' }}>Pending</span>;
};

function OutstandingReport({ invoices = [], exportToCSV }) {
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('');

  // Item Types List for Filter Dropdown
  const uniqueItemTypes = Array.from(new Set(invoices.map(inv => inv.item_type).filter(Boolean)));
  const uniqueDistricts = Array.from(new Set(invoices.map(inv => inv.district).filter(Boolean)));

  const filteredInvoices = invoices.filter(inv => {
    const matchesDistrict = selectedDistrict ? inv.district === selectedDistrict : true;
    const matchesItemType = selectedItemType ? inv.item_type === selectedItemType : true;
    return matchesDistrict && matchesItemType;
  });

  return (
    <div>
      <h1 className="header-title">Reports</h1>

      <div className="card">
        <div className="card-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Outstanding Balances</h2>
          {exportToCSV && (
            <button className="btn btn-primary" onClick={exportToCSV}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} />
            <select 
              className="form-control" 
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">-- All Districts --</option>
              {uniqueDistricts.map((dist, idx) => (
                <option key={idx} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select 
              className="form-control" 
              value={selectedItemType} 
              onChange={(e) => setSelectedItemType(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">-- All Item Types --</option>
              {uniqueItemTypes.map((item, idx) => (
                <option key={idx} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>District</th>
                <th>Inv No</th>
                <th>Item Type</th>
                <th>Age</th>
                <th>Due Date</th>
                <th>Invoiced Amount</th>
                <th>Paid Amount</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: '#64748b' }}>No record found.</td>
                </tr>
              ) : (
                filteredInvoices.slice().reverse().map((inv, idx) => {
                  const balance = (parseFloat(inv.invoiced_amount) || 0) - (parseFloat(inv.paid_amount) || 0);
                  const ageDays = calculateAgeInDays(inv.invoice_date);

                  return (
                    <tr key={inv.id || idx}>
                      <td><strong>{inv.customer_name}</strong></td>
                      <td>{inv.district || '-'}</td>
                      <td><strong>{inv.invoice_no || '-'}</strong></td>
                      <td>{inv.item_type || '-'}</td>
                      <td><strong>{ageDays} Days</strong></td>
                      <td>{formatDate(inv.due_date)}</td>
                      <td>{formatCurrency(inv.invoiced_amount)}</td>
                      <td>{formatCurrency(inv.paid_amount)}</td>
                      <td style={{ color: balance > 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                        {formatCurrency(balance)}
                      </td>
                      <td>{getStatusBadge(inv.due_date, balance)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OutstandingReport;