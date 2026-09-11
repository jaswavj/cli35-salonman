import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { quickBillApi, quickBillError } from '../../../api/quick-bill/quick-bill-api-service';
import './QuickBill.css';

type PayMode = 'cash' | 'gpay';

const QuickBillPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState<PayMode | ''>('');
  const [tipsAmount, setTipsAmount] = useState('');
  const [tipsPayMode, setTipsPayMode] = useState<PayMode | ''>('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.warning('Enter a valid amount');
      return;
    }
    if (payMode !== 'cash' && payMode !== 'gpay') {
      toast.warning('Select Cash or GPay');
      return;
    }
    const tipsValue = tipsAmount.trim() === '' ? 0 : parseFloat(tipsAmount);
    if (!Number.isFinite(tipsValue) || tipsValue < 0) {
      toast.warning('Enter a valid tips amount');
      return;
    }
    if (tipsValue > 0 && tipsPayMode !== 'cash' && tipsPayMode !== 'gpay') {
      toast.warning('Select Cash or GPay for tips');
      return;
    }
    setBusy(true);
    try {
      await quickBillApi.save({
        amount: value,
        payMode,
        tipsAmount: tipsValue,
        tipsPayMode: tipsValue > 0 ? tipsPayMode : '',
        notes: notes.trim(),
      });
      toast.success('Bill saved');
      setAmount('');
      setPayMode('');
      setTipsAmount('');
      setTipsPayMode('');
      setNotes('');
    } catch (err) {
      toast.error(quickBillError(err, 'Could not save bill'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qb-page">
      <form className="qb-card" onSubmit={onSubmit}>
        <header className="qb-head">
          <h2>Salon Billing</h2>
          <p>Enter amount, choose payment, and save.</p>
        </header>

        <label className="qb-label" htmlFor="qb-amount">Amount</label>
        <div className="qb-amount-wrap">
          <span className="qb-rupee">₹</span>
          <input
            id="qb-amount"
            className="qb-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
            autoComplete="off"
          />
        </div>

        <p className="qb-label">Payment</p>
        <div className="qb-pay" role="group" aria-label="Payment mode">
          <button
            type="button"
            className={`qb-pay-btn ${payMode === 'cash' ? 'on' : ''}`}
            onClick={() => setPayMode('cash')}
          >
            <i className="fas fa-money-bill-wave" />
            Cash
          </button>
          <button
            type="button"
            className={`qb-pay-btn ${payMode === 'gpay' ? 'on' : ''}`}
            onClick={() => setPayMode('gpay')}
          >
            <i className="fas fa-mobile-alt" />
            GPay
          </button>
        </div>

        <label className="qb-label" htmlFor="qb-tips">Tips Amount</label>
        <div className="qb-amount-wrap compact">
          <span className="qb-rupee">₹</span>
          <input
            id="qb-tips"
            className="qb-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={tipsAmount}
            onChange={(e) => setTipsAmount(e.target.value)}
            placeholder="0.00"
            autoComplete="off"
          />
        </div>

        <p className="qb-label">Tips Payment</p>
        <div className="qb-pay" role="group" aria-label="Tips payment mode">
          <button
            type="button"
            className={`qb-pay-btn compact ${tipsPayMode === 'cash' ? 'on' : ''}`}
            onClick={() => setTipsPayMode('cash')}
          >
            <i className="fas fa-money-bill-wave" />
            Cash
          </button>
          <button
            type="button"
            className={`qb-pay-btn compact ${tipsPayMode === 'gpay' ? 'on' : ''}`}
            onClick={() => setTipsPayMode('gpay')}
          >
            <i className="fas fa-mobile-alt" />
            GPay
          </button>
        </div>

        {/* Notes hidden for now — keep for later use */}
        <div hidden>
          <label className="qb-label" htmlFor="qb-notes">Notes</label>
          <textarea
            id="qb-notes"
            className="qb-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <button className="qb-save" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default QuickBillPage;
