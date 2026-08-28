import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { LayoutDashboard, Users, FileText, CreditCard, PieChart, Upload, Download, Plus, Receipt } from 'lucide-react';
import SalesInvoice from './components/SalesInvoice';
import Payments from './components/Payments';
import Items from './components/Items';
import OutstandingReport from './components/OutstandingReport';
import CollectionReport from './components/CollectionReport';
import './App.css';

const supabaseUrl = 'https://hbrlfkjvagcsadzzqrcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhicmxma2p2YWdjc2FkenpxcmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjA0ODgsImV4cCI6MjEwMzEzNjQ4OH0.raGGmXPqFSlZtqzxjRF3LLGIgjuTZs4OH2-aXQKppLM'; 
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
  'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
  'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
];

function App() {
  // Application default initial page set to 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Form States - Customer
  const [custName, setCustName] = useState('');
  const [custDistrict, setCustDistrict] = useState('');
  const [custCreditPeriod, setCustCreditPeriod] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const { data: custData } = await supabase.from('customers').select('*');
    if (custData) setCustomers(custData);

    const { data: itemData } = await supabase.from('items').select('*');
    if (itemData) setItems(itemData);

    const { data: invData } = await supabase.from('invoices').select('*');
    if (invData) setInvoices(invData);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!custDistrict) {
      alert("Please select a district!");
      return;
    }

    const { error } = await supabase.from('customers').insert([{ 
      name: custName, 
      district: custDistrict,
      credit_period: parseInt(custCreditPeriod) || 0,
      credit_limit: parseFloat(custCreditLimit) || 0
    }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Customer Added Successfully!");
      setCustName(''); 
      setCustDistrict('');
      setCustCreditPeriod(''); 
      setCustCreditLimit('');
      fetchAllData();
    }
  };

  const handleCSVImport = (e, tableName) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        await supabase.from(tableName).insert(results.data);
        fetchAllData();
      }
    });
  };

  const exportToCSV = () => {
    const reportData = invoices.map(inv => ({
      Customer: inv.customer_name,
      InvoiceNo: inv.invoice_no,
      InvoiceDate: inv.invoice_date,
      InvoicedAmount: inv.invoiced_amount,
      PaidAmount: inv.paid_amount,
      OutstandingAmount: inv.invoiced_amount - inv.paid_amount
    }));
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Outstanding_Report.csv');
    document.body.appendChild(link);
    link.click();
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.invoiced_amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  return (
    <div className="app-container">
      {/* Fixed Sidebar Navigation Structure */}
      <aside className="sidebar">
        <div className="brand">
          <FileText size={28} /> Enterprise ERP
        </div>
        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          
          <button className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
            <Users size={18} /> Customers
          </button>
          
          <button className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
            <FileText size={18} /> Create Sales Invoice
          </button>
          
          {/* Payment Entry */}
          <button className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
            <CreditCard size={18} /> Payments Entry
          </button>

          {/* Outstanding Report */}
          <button className={`nav-item ${activeTab === 'outstanding' ? 'active' : ''}`} onClick={() => setActiveTab('outstanding')}>
            <PieChart size={18} /> Outstanding Report
          </button>

          {/* Collection Report Tab Added */}
          <button className={`nav-item ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setActiveTab('collection')}>
            <Receipt size={18} /> Collection Report
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="header-title">Dashboard Overview</h1>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-info">
                  <p>Total Invoiced</p>
                  <h3>₹{totalInvoiced.toLocaleString('en-IN')}</h3>
                </div>
                <div className="kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><FileText /></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-info">
                  <p>Total Collected</p>
                  <h3>₹{totalPaid.toLocaleString('en-IN')}</h3>
                </div>
                <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><CreditCard /></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-info">
                  <p>Total Outstanding</p>
                  <h3>₹{totalOutstanding.toLocaleString('en-IN')}</h3>
                </div>
                <div className="kpi-icon" style={{ background: '#fee2e2', color: '#ef4444' }}><PieChart /></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-info">
                  <p>Total Customers</p>
                  <h3>{customers.length}</h3>
                </div>
                <div className="kpi-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}><Users /></div>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">Recent Transactions</h2>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Inv No</th>
                      <th>Invoiced Amount</th>
                      <th>Paid Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(-5).reverse().map((inv, idx) => {
                      const balance = inv.invoiced_amount - inv.paid_amount;
                      return (
                        <tr key={inv.id || idx}>
                          <td><strong>{inv.customer_name}</strong></td>
                          <td>{inv.invoice_no || '-'}</td>
                          <td>₹{inv.invoiced_amount}</td>
                          <td>₹{inv.paid_amount}</td>
                          <td>
                            <span className={`badge ${balance <= 0 ? 'badge-success' : 'badge-danger'}`}>
                              {balance <= 0 ? 'Fully Paid' : `Pending: ₹${balance}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div>
            <h1 className="header-title">Customer Management</h1>
            <div className="card">
              <h2 className="card-title">Add New Customer</h2>
              <form onSubmit={handleAddCustomer} className="form-grid">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input className="form-control" placeholder="Acme Corp" value={custName} onChange={(e) => setCustName(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label>District</label>
                  <select 
                    className="form-control" 
                    value={custDistrict} 
                    onChange={(e) => setCustDistrict(e.target.value)} 
                    required
                  >
                    <option value="">-- Select District --</option>
                    {KERALA_DISTRICTS.map((dist, index) => (
                      <option key={index} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Credit Period (Days)</label>
                  <input className="form-control" type="number" placeholder="30" value={custCreditPeriod} onChange={(e) => setCustCreditPeriod(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Credit Limit (Amount ₹)</label>
                  <input className="form-control" type="number" placeholder="50000" value={custCreditLimit} onChange={(e) => setCustCreditLimit(e.target.value)} required />
                </div>
                <div className="form-group full-width">
                  <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Customer</button>
                </div>
              </form>
            </div>

            <div className="card">
              <div className="card-title">
                <span>Customer Directory</span>
                <label className="btn btn-primary" style={{ background: '#475569', fontSize: '12px', cursor: 'pointer' }}>
                  <Upload size={14} /> Import CSV
                  <input type="file" accept=".csv" hidden onChange={(e) => handleCSVImport(e, 'customers')} />
                </label>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr><th>Name</th><th>District</th><th>Credit Period</th><th>Credit Limit</th></tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={i}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.district}</td>
                        <td>{c.credit_period} Days</td>
                        <td>₹{c.credit_limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <Items items={items} fetchAllData={fetchAllData} />
        )}

        {/* Sales Invoice Tab */}
        {activeTab === 'sales' && (
          <SalesInvoice customers={customers} invoices={invoices} fetchAllData={fetchAllData} />
        )}

        {/* Customer Payment Tab */}
        {activeTab === 'payment' && (
          <Payments customers={customers} invoices={invoices} fetchAllData={fetchAllData} />
        )}

        {/* Outstanding Report Tab */}
        {activeTab === 'outstanding' && (
          <OutstandingReport invoices={invoices} customers={customers} exportToCSV={exportToCSV} />
        )}

        {/* Collection Report Tab */}
        {activeTab === 'collection' && (
          <CollectionReport customers={customers} />
        )}

      </main>
    </div>
  );
}

export default App;