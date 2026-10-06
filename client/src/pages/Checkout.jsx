import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { payForOrder } from '../utils/razorpay.js';
import { inr } from '../utils/format.js';
import AddressFields from '../components/AddressFields.jsx';

export default function Checkout() {
  const { items, subtotal, shipping, total, clear, sync } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState('cod');

  // Cash on delivery is only offered when EVERY item in the bag has COD
  // switched on by the admin. (The server enforces this too.)
  useEffect(() => {
    sync(); // pick up price / stock / COD changes made since the bag was saved
  }, [sync]);
  const codBlocked = items.filter((i) => !i.codAvailable);
  const codOk = codBlocked.length === 0;
  useEffect(() => {
    if (!codOk && payment === 'cod') setPayment('online');
  }, [codOk, payment]);
  const [placing, setPlacing] = useState(false);
  const [placingLabel, setPlacingLabel] = useState('Place order');
  const [error, setError] = useState('');
  const blankAddress = {
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  };
  const [form, setForm] = useState(blankAddress);

  // Saved addresses (Myntra-style): pick one, or add another when you're
  // somewhere else. `addresses === null` while loading.
  const [addresses, setAddresses] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [locateTick, setLocateTick] = useState(0);
  const [saveForLater, setSaveForLater] = useState(true);

  const loadAddresses = (preferId) =>
    api
      .getAddresses()
      .then((list) => {
        setAddresses(list);
        const pick = list.find((a) => a._id === preferId) || list.find((a) => a.isDefault) || list[0];
        if (pick) {
          setSelectedId(pick._id);
          setMode('list');
        } else {
          setMode('form');
        }
      })
      .catch(() => {
        setAddresses([]);
        setMode('form');
      });
  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = (locate) => {
    setEditingId(null);
    setForm(blankAddress);
    setMode('form');
    setError('');
    if (locate) setLocateTick((n) => n + 1);
  };
  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({
      label: a.label || 'Home', fullName: a.fullName, phone: a.phone, line1: a.line1,
      line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode,
    });
    setMode('form');
    setError('');
  };
  const removeAddress = async (a) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await api.deleteAddress(a._id);
      await loadAddresses(selectedId === a._id ? undefined : selectedId);
    } catch (err) {
      setError(err.message);
    }
  };

  const formIsValid = () =>
    form.fullName.trim() && form.phone.trim() && form.line1.trim() && form.city.trim() &&
    form.state.trim() && /^\d{6}$/.test(form.pincode);

  // "Save & deliver here" — stores (or updates) the address and selects it.
  const saveAddressNow = async () => {
    setError('');
    if (!formIsValid()) {
      setError('Please fill in name, mobile, a 6-digit PIN, address, city and state.');
      return;
    }
    try {
      const saved = editingId
        ? await api.updateAddress(editingId, form)
        : await api.addAddress({ ...form, isDefault: !addresses?.length });
      await loadAddresses(saved._id);
    } catch (err) {
      setError(err.message);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty" style={{ padding: '120px 20px' }}>
        <h3>Your bag is empty</h3>
        <p>Add a piece before checking out.</p>
        <Link to="/shop" className="btn btn--primary">Explore the collection</Link>
      </div>
    );
  }

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    const chosen = mode === 'list' ? addresses?.find((a) => a._id === selectedId) : form;
    if (!chosen) {
      setError('Please choose a delivery address or add a new one.');
      return;
    }
    setPlacing(true);
    try {
      // Delivering to an address typed in the form: keep it for next time
      // (best effort — never blocks the order).
      if (mode === 'form') {
        try {
          if (editingId) await api.updateAddress(editingId, form);
          else if (saveForLater) {
            const dup = addresses?.some((a) => a.line1 === form.line1 && a.pincode === form.pincode);
            if (!dup) await api.addAddress({ ...form, isDefault: !addresses?.length });
          }
        } catch {
          /* ignore */
        }
      }
      setPlacingLabel('Placing order…');
      const order = await api.createOrder({
        items: items.map((i) => ({ product: i.product, qty: i.qty })),
        shippingAddress: {
          fullName: chosen.fullName, phone: chosen.phone, line1: chosen.line1, line2: chosen.line2 || '',
          city: chosen.city, state: chosen.state, pincode: chosen.pincode,
        },
        paymentMethod: payment,
      });

      if (payment === 'cod') {
        clear();
        navigate(`/order-success/${order._id}`, { state: { order } });
        return;
      }

      // Online payment: open Razorpay Checkout and wait for the result
      // before deciding where to send the customer.
      setPlacingLabel('Opening payment…');
      const result = await payForOrder(order, { customerEmail: user?.email });

      if (result.ok) {
        clear();
        navigate(`/order-success/${order._id}`, { state: { order: result.order } });
      } else if (result.dismissed) {
        setError('Payment was not completed. Your order is saved — you can retry payment from "My orders".');
        setPlacing(false);
      } else {
        setError(result.message || 'Payment failed. Your order is saved — you can retry payment from "My orders".');
        setPlacing(false);
      }
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Checkout</h1>
        <div className="crumbs">
          <Link to="/cart">Bag</Link> / <span>Checkout</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <form className="checkout" onSubmit={placeOrder}>
            <div>
              {error && <div className="form-error">{error}</div>}

              <div className="checkout__panel">
                <div className="addr-head">
                  <h3>Delivery address</h3>
                  {mode === 'list' && addresses?.length > 0 && (
                    <button type="button" className="addr-link" onClick={() => openNew(true)}>
                      ◎ Use my current location
                    </button>
                  )}
                </div>

                {addresses === null ? (
                  <div className="loader"><div className="spinner" /></div>
                ) : mode === 'list' ? (
                  <div className="addr-list">
                    {addresses.map((a) => (
                      <label key={a._id} className={`addr-card ${selectedId === a._id ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="deliveryAddress"
                          checked={selectedId === a._id}
                          onChange={() => setSelectedId(a._id)}
                        />
                        <div className="addr-card__body">
                          <div className="addr-card__top">
                            <strong>{a.fullName}</strong>
                            <span className="addr-tag">{a.label}</span>
                            {a.isDefault && <span className="addr-tag addr-tag--default">Default</span>}
                          </div>
                          <p>
                            {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                            <br />
                            {a.city}, {a.state} – {a.pincode}
                          </p>
                          <p className="addr-card__phone">Mobile: {a.phone}</p>
                          <div className="addr-card__actions">
                            <button type="button" onClick={(e) => { e.preventDefault(); openEdit(a); }}>Edit</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); removeAddress(a); }}>Remove</button>
                          </div>
                        </div>
                      </label>
                    ))}
                    <button type="button" className="addr-add" onClick={() => openNew(false)}>
                      + Add a new address
                    </button>
                  </div>
                ) : (
                  <div>
                    <AddressFields form={form} setForm={setForm} autoLocate={locateTick} />
                    {!editingId && (
                      <label className="addr-save">
                        <input type="checkbox" checked={saveForLater} onChange={(e) => setSaveForLater(e.target.checked)} />
                        Save this address for next time
                      </label>
                    )}
                    <div className="addr-form-actions">
                      <button type="button" className="btn btn--ghost" onClick={saveAddressNow}>
                        {editingId ? 'Save changes' : 'Save & deliver here'}
                      </button>
                      {addresses.length > 0 && (
                        <button type="button" className="addr-link" onClick={() => { setMode('list'); setError(''); }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="checkout__panel">
                <h3>Payment</h3>
                <label
                  className={`radio-card ${payment === 'cod' ? 'active' : ''}`}
                  style={codOk ? undefined : { opacity: 0.55, cursor: 'not-allowed' }}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === 'cod'}
                    disabled={!codOk}
                    onChange={() => setPayment('cod')}
                  />
                  <div>
                    <strong>Cash on delivery</strong>
                    {codOk ? (
                      <span>Pay when your order arrives.</span>
                    ) : (
                      <span>
                        Not available for{' '}
                        {codBlocked.length === 1
                          ? `“${codBlocked[0].name}”`
                          : `${codBlocked.length} items in your bag`}
                        . Please pay online.
                      </span>
                    )}
                  </div>
                </label>
                <label className={`radio-card ${payment === 'online' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === 'online'}
                    onChange={() => setPayment('online')}
                  />
                  <div>
                    <strong>Pay online</strong>
                    <span>UPI / cards / netbanking via Razorpay.</span>
                  </div>
                </label>

                {payment === 'online' && (
                  <div className="pay-note">
                    You'll be redirected to Razorpay's secure checkout to complete payment.
                    <div className="pay-logos">
                      <span>UPI</span><span>Visa</span><span>Mastercard</span><span>RuPay</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-card">
              <h3>Your order</h3>
              {items.map((i) => (
                <div className="summary-row" key={i._id}>
                  <span>{i.name} × {i.qty}</span>
                  <span>{inr(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="summary-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <span>Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : inr(shipping)}</span>
              </div>
              <div className="summary-row summary-row--total">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
              <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} disabled={placing}>
                {placing ? placingLabel : payment === 'online' ? `Pay ${inr(total)}` : 'Place order'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
