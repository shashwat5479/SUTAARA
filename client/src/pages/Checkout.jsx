import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { inr } from '../utils/format.js';

export default function Checkout() {
  const { items, subtotal, shipping, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
    setPlacing(true);
    try {
      const order = await api.createOrder({
        items: items.map((i) => ({ product: i.product, qty: i.qty })),
        shippingAddress: form,
        paymentMethod: payment,
      });
      clear();
      navigate(`/order-success/${order._id}`, { state: { order } });
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
                <h3>Shipping address</h3>
                <div className="field">
                  <label>Full name</label>
                  <input value={form.fullName} onChange={set('fullName')} required />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={set('phone')} required inputMode="tel" />
                </div>
                <div className="field">
                  <label>Address line 1</label>
                  <input value={form.line1} onChange={set('line1')} required />
                </div>
                <div className="field">
                  <label>Address line 2 (optional)</label>
                  <input value={form.line2} onChange={set('line2')} />
                </div>
                <div className="field__row">
                  <div className="field">
                    <label>City</label>
                    <input value={form.city} onChange={set('city')} required />
                  </div>
                  <div className="field">
                    <label>State</label>
                    <input value={form.state} onChange={set('state')} required />
                  </div>
                </div>
                <div className="field">
                  <label>PIN code</label>
                  <input value={form.pincode} onChange={set('pincode')} required inputMode="numeric" />
                </div>
              </div>

              <div className="checkout__panel">
                <h3>Payment</h3>
                <label className={`radio-card ${payment === 'cod' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === 'cod'}
                    onChange={() => setPayment('cod')}
                  />
                  <div>
                    <strong>Cash on delivery</strong>
                    <span>Pay when your order arrives.</span>
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
                    <span>UPI / cards — gateway coming soon.</span>
                  </div>
                </label>

                <div className="pay-note">
                  <strong>Demo store.</strong> No real payment is processed. Choosing “Pay online”
                  simply records the order as pending — a live gateway can be added later.
                  <div className="pay-logos">
                    <span>UPI</span><span>Visa</span><span>Mastercard</span><span>RuPay</span>
                  </div>
                </div>
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
                {placing ? 'Placing order…' : 'Place order'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
