import React, { useState, useEffect } from 'react';
import { Download, Search, Calendar, FileText } from 'lucide-react';
import { supabase } from '../App';
import Papa from 'papaparse';

// Helper for currency formatting
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(num);
};

// Helper for date formatting
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

function CollectionReport({ customers = [] }) {
  const [payments, setPayments] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMode, setPaymentMode] = useState('');

  // Fetch Payment Collections from 'invoices' table
  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('payment_date', { ascending: false });

    if (!error && data) {
      // Filter records that have paid_amount > 0 OR advance > 0
      const collections = data
        .filter((item) => (parseFloat(item.paid_amount) > 0 || parseFloat(item.advance) > 0))
        .map((item) => {
          const isAdv = parseFloat(item.advance) > 0;
          return {
            id: item.id,
            payment_date: item.payment_date || item.created_at,
            customer_name: item.customer_name,
            payment_mode: item.payment_mode || 'Cash',
            reference_no: item.reference_no || item.invoice_no || '-',
            amount: isAdv ? parseFloat(item.advance) : parseFloat(item.paid_amount),
            is_advance: isAdv,
            remarks: isAdv ? 'Advance Payment' : 'Invoice Payment'
          };
        });

      setPayments(collections);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter collections based on date range, customer & payment mode
  const filteredPayments = payments.filter((item) => {
    const payDate = item.payment_date ? item.payment_date.split('T')[0] : '';
    const matchesStartDate = !startDate || payDate >= startDate;
    const matchesEndDate = !endDate || payDate <= endDate;
    const matchesCustomer = !selectedCustomer || item.customer_name === selectedCustomer;
    const matchesMode = !paymentMode || item.payment_mode === paymentMode;

    return matchesStartDate && matchesEndDate && matchesCustomer && matchesMode;
  });

  // Calculate Total Collections
  const totalCollectedAmount = filteredPayments.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      alert('No collections data to export!');
      return;
    }

    const exportData = filteredPayments.map((p) => ({
      'Ref / Invoice No': p.reference_no,
      'Payment Date': formatDate(p.payment_date),
      'Customer Name': p.customer_name,
      'Payment Mode': p.payment_mode,
      'Amount Collected': p.amount,
      'Type / Remarks': p.remarks
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Collection_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="header-title">Collection Report</h1>
        <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary KPI Card */}
      <div className="kpi-grid" style={{ marginBottom: '25px' }}>
        <div className="kpi-card">
          <div className="kpi-info">
            <p>Total Collection Count</p>
            <h3>{filteredPayments.length}</h3>
          </div>
          <div className="kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <FileText />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <p>Total Collected Amount</p>
            <h3>{formatCurrency(totalCollectedAmount)}</h3>
          </div>
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Calendar />
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card" style={{ marginBottom: '25px' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} /> Filter Collections
        </h2>
        <div className="form-grid">
          <div className="form-group">
            <label>From Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>To Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Customer</label>
            <select
              className="form-control"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">-- All Customers --</option>
              {customers.map((c, i) => (
                <option key={i} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Payment Mode</label>
            <select
              className="form-control"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="">-- All Modes --</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer / UPI">Bank Transfer / UPI</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <h2 className="card-title">Collection Records</h2>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Payment Mode</th>
                <th>Ref / Receipt No</th>
                <th>Amount Collected</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                    No collection transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((item, i) => (
                  <tr key={item.id || i}>
                    <td>{formatDate(item.payment_date)}</td>
                    <td><strong>{item.customer_name}</strong></td>
                    <td>{item.payment_mode}</td>
                    <td>{item.reference_no}</td>
                    <td><strong style={{ color: '#16a34a' }}>{formatCurrency(item.amount)}</strong></td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: item.is_advance ? '#fef3c7' : '#e0f2fe',
                        color: item.is_advance ? '#d97706' : '#0369a1'
                      }}>
                        {item.remarks}
                      </span>
                    </td>
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

export default CollectionReport;