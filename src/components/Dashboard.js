import React from 'react';
import { FileText, CreditCard, PieChart, Users } from 'lucide-react';

function Dashboard({ customers, invoices }) {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.invoiced_amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  return (
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
                <th>Item Name</th>
                <th>Invoiced Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(-5).reverse().map((inv) => {
                const balance = inv.invoiced_amount - inv.paid_amount;
                return (
                  <tr key={inv.id}>
                    <td><strong>{inv.customer_name}</strong></td>
                    <td>{inv.item_name}</td>
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
  );
}

export default Dashboard;