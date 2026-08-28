import React, { useState } from 'react';
import { CreditCard, FileText, Search, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '../App';

function Payments({ customers = [], invoices = [], fetchAllData }) {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [allocations, setAllocations] = useState({});

  const handleCustomerChange = (e) => {
    setSelectedCustomer(e.target.value);
    setShowInvoices(false);
    setAllocations({});
  };

  const handleGetInvoices = () => {
    if (!selectedCustomer) {
      alert("ദയവായി ആദ്യം Customer-നെ തിരഞ്ഞെടുക്കുക!");
      return;
    }
    setShowInvoices(true);

    if (paidAmount && parseFloat(paidAmount) > 0 && !isAdvance) {
      let remainingToAllocate = parseFloat(paidAmount);
      const newAlloc = {};

      const custInvs = invoices.filter(
        (inv) => inv.customer_name === selectedCustomer && (inv.invoiced_amount - inv.paid_amount) > 0
      );

      for (const inv of custInvs) {
        if (remainingToAllocate <= 0) break;
        const outstanding = inv.invoiced_amount - inv.paid_amount;
        const allocate = Math.min(outstanding, remainingToAllocate);
        newAlloc[inv.id] = allocate;
        remainingToAllocate -= allocate;
      }
      setAllocations(newAlloc);
    }
  };

  const handleAllocationChange = (invId, value) => {
    setAllocations({
      ...allocations,
      [invId]: value
    });
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();

    const totalPaid = parseFloat(paidAmount) || 0;

    if (totalPaid <= 0) {
      alert("ദയവായി സാധുവായ ഒരു Amount നൽകുക!");
      return;
    }

    // 1. Advance Payment Handling (invoices table-ലെ advance column-ലേക്ക് direct insert ചെയ്യും)
    if (isAdvance) {
      const { error: payErr } = await supabase.from('invoices').insert([
        {
          customer_name: selectedCustomer,
          advance: totalPaid,
          payment_date: paymentDate,
          payment_mode: paymentMode,
          reference_no: referenceNo || 'ADVANCE'
        }
      ]);

      if (payErr) {
        alert("Error saving advance payment: " + payErr.message);
        return;
      }

      alert("Advance Payment Successfully Saved!");
    } else {
      // 2. Normal Invoice Allocation Logic (invoices table-ലെ paid_amount update ചെയ്യും)
      const allocatedInvoices = Object.keys(allocations).filter(
        (invId) => parseFloat(allocations[invId]) > 0
      );

      if (allocatedInvoices.length === 0) {
        alert("Enter an Allocated Amount in at least one invoice, or select Advance Entry!");
        return;
      }

      for (const invId of allocatedInvoices) {
        const targetInv = invoices.find((inv) => String(inv.id) === String(invId));
        if (targetInv) {
          const addAmount = parseFloat(allocations[invId]) || 0;
          const newPaidTotal = (parseFloat(targetInv.paid_amount) || 0) + addAmount;

          const { error } = await supabase
            .from('invoices')
            .update({ 
              paid_amount: newPaidTotal,
              payment_date: paymentDate
            })
            .eq('id', invId);

          if (error) console.error("Error updating invoice:", error);
        }
      }

      alert("Payment Allocated & Saved Successfully!");
    }

    // Reset Form
    setSelectedCustomer('');
    setPaidAmount('');
    setReferenceNo('');
    setIsAdvance(false);
    setShowInvoices(false);
    setAllocations({});
    if (fetchAllData) fetchAllData();
  };

  const customerInvoices = invoices.filter(
    (inv) => inv.customer_name === selectedCustomer && (inv.invoiced_amount - inv.paid_amount) > 0
  );

  return (
    <div>
      <h1 className="header-title">New Payment Entry</h1>
      <div className="card" style={{ maxWidth: '850px' }}>
        <h2 className="card-title">Payment From / To</h2>
        
        <form onSubmit={handleSavePayment}>
          <div className="form-grid">
            
            {/* Customer Select */}
            <div className="form-group">
              <label>Party / Customer Name</label>
              <select
                className="form-control"
                value={selectedCustomer}
                onChange={handleCustomerChange}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c, i) => (
                  <option key={i} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Paid Amount */}
            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input
                className="form-control"
                type="number"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                required
              />
            </div>

            {/* Payment Date */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Payment Date
              </label>
              <input
                className="form-control"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <label>Payment Mode</label>
              <select 
                className="form-control" 
                value={paymentMode} 
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer / UPI">Bank Transfer / UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Reference No / Cheque No */}
            <div className="form-group">
              <label>Ref No / Cheque No</label>
              <input 
                className="form-control" 
                placeholder="e.g. UPI-98402 / Chq-002" 
                value={referenceNo} 
                onChange={(e) => setReferenceNo(e.target.value)} 
              />
            </div>

            {/* Advance Payment Checkbox Option */}
            <div className="form-group full-width" style={{ marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  checked={isAdvance} 
                  onChange={(e) => {
                    setIsAdvance(e.target.checked);
                    if (e.target.checked) setShowInvoices(false);
                  }}
                  style={{ width: '18px', height: '18px' }}
                />
                Mark as Advance Payment (Invoices-ൽ Allocate ചെയ്യേണ്ടതില്ല)
              </label>
            </div>

          </div>

          {/* Action Buttons */}
          {!isAdvance && (
            <div style={{ marginTop: '15px', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#475569', borderColor: '#475569' }}
                onClick={handleGetInvoices}
              >
                <Search size={15} style={{ marginRight: '6px' }} /> Get Outstanding Invoices
              </button>
            </div>
          )}

          {/* Advance Save Button */}
          {isAdvance && (
            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-success">
                <CheckCircle size={16} /> Save Advance Payment
              </button>
            </div>
          )}

          {/* Invoice Table Container */}
          {showInvoices && !isAdvance && (
            <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <FileText size={18} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                  Payment References ({selectedCustomer})
                </h3>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Invoice No</th>
                      <th>Grand Total (₹)</th>
                      <th>Outstanding (₹)</th>
                      <th style={{ width: '180px' }}>Allocated (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                          No outstanding invoices found for {selectedCustomer}.
                        </td>
                      </tr>
                    ) : (
                      customerInvoices.map((inv) => {
                        const outstanding = inv.invoiced_amount - inv.paid_amount;
                        return (
                          <tr key={inv.id}>
                            <td>Sales Invoice</td>
                            <td><strong>{inv.invoice_no || 'INV-' + inv.id}</strong></td>
                            <td>₹{inv.invoiced_amount}</td>
                            <td style={{ color: '#dc2626', fontWeight: 'bold' }}>₹{outstanding}</td>
                            <td>
                              <input
                                className="form-control"
                                type="number"
                                placeholder="0.00"
                                max={outstanding}
                                value={allocations[inv.id] || ''}
                                onChange={(e) => handleAllocationChange(inv.id, e.target.value)}
                                style={{ padding: '4px 8px', fontSize: '14px' }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn-success">
                  <CreditCard size={16} /> Save & Submit Payment
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

export default Payments;