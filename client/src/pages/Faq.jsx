import { useState } from 'react';
import { Link } from 'react-router-dom';

const CARE_EMAIL = 'care@sutaara.com';

const FAQ_SECTIONS = [
  {
    group: 'Orders',
    items: [
      ['How do I know if my order has been confirmed?', 'Once your order is successfully placed, you will receive an order confirmation on your registered email address and/or WhatsApp number.'],
      ['Can I change or cancel my order?', 'Yes, you may request a cancellation within 24 hours of placing your order, provided it has not already been dispatched. Once an order has been shipped or customisation has begun, it cannot be cancelled.'],
      ['Can I change my delivery address after placing an order?', `Please contact us within 2 hours of placing your order at ${CARE_EMAIL} if you need to update the delivery address. Once the order has been processed or dispatched, we may not be able to make changes.`],
    ],
  },
  {
    group: 'Shipping & Delivery',
    items: [
      ['How long does delivery take within India?', 'Orders are generally dispatched within 3–4 working days and typically reach you within 7 working days after dispatch. During sales, festive periods or high-volume periods, processing and delivery may take slightly longer.'],
      ['Do you offer free shipping?', 'Yes. Shipping within India is free on orders above ₹4999. A flat shipping charge of ₹100 applies to orders below this value.'],
      ['Do you ship internationally?', 'Yes, we accept international orders through WhatsApp. Please contact us to place your order. Shipping charges depend on the destination and package weight, and are payable by the customer.'],
      ['How can I track my order?', 'Once your order has been dispatched, tracking details will be shared with you on your registered email address and/or WhatsApp number.'],
    ],
  },
  {
    group: 'Returns, Exchanges & Refunds',
    items: [
      ['Can I return or exchange a product?', `Returns or exchanges are accepted only in cases where the product received is damaged, defective or incorrect, subject to verification. You must contact us within 48 hours of delivery with your Order ID and clear photographs or videos of the product at ${CARE_EMAIL}.`],
      ['What if I contact you after 48 hours?', 'Any return or exchange request made after 48 hours of delivery will not be eligible for consideration.'],
      ['Can I return a sale or discounted product?', 'No. Products purchased on sale, discount, clearance or under special promotional offers are not eligible for return or exchange, unless the product received is damaged, defective or incorrect.'],
      ['Can customised products be returned?', 'No. Products that have been customised or ordered specifically at your request are not eligible for return or exchange.'],
      ['What condition should the product be in for a return?', 'The product must be unused, unworn, unwashed and unaltered, with all original tags and packaging intact.'],
      ['What if my package arrives damaged?', 'If the package appears opened, damaged or tampered with at the time of delivery, we recommend refusing the shipment wherever possible. If you notice an issue after accepting the package, please contact us within 48 hours with photographs or an unboxing video where available.'],
      ['How will I receive my refund?', 'Approved refunds will be processed to the original mode of payment. Refunds are generally initiated within 7–10 working days of approval or inspection of the returned product.'],
    ],
  },
  {
    group: 'Account & Ordering',
    items: [
      ['Do I need to create an account to shop on Sutaara?', 'No. You can shop with us without creating an account. However, creating an account makes it easier to view your order history, save your details and maintain your wishlist.'],
      ['How do I create an account?', 'Click on Login / Register and create an account using your email address and password.'],
      ['I forgot my password. What should I do?', 'Click on Forgot Password on the login page and follow the instructions sent to your registered email address.'],
      ['What payment methods do you accept?', 'You can pay securely using the payment options available at checkout, including supported credit cards, debit cards, UPI, net banking and other available online payment methods.'],
      ['I am unable to place an order. What should I do?', `Please try refreshing the page or using a different browser or device. If the issue continues, write to us at ${CARE_EMAIL} with a screenshot of the issue and we will assist you.`],
      ['I accidentally placed the same order twice. What should I do?', `Please contact us immediately at ${CARE_EMAIL} with both Order IDs. If the duplicate order has not been dispatched, we will help cancel it and process the applicable refund.`],
      ['Can I add another product to an order I have already placed?', 'Once an order has been successfully placed, items cannot be added to or edited within the same order. You can place a separate order for any additional products.'],
      ['Can I order a product that is sold out?', `Some products, particularly handcrafted or limited pieces, may not be restocked in exactly the same design. You can reach out to us at ${CARE_EMAIL} to check whether the product is expected to return or if we can suggest something similar.`],
      ['Why have I received only part of my order?', 'In some cases, products from the same order may be shipped separately. If this happens, you will receive separate tracking information for the remaining shipment. If an item becomes unavailable after your order is placed, our team will contact you with the available options.'],
      ['How do I find a particular product on the website?', `You can browse products through Shop, filter by product type or fabric, or use the search bar to look for a specific product. If you are still unable to find what you are looking for, contact us at ${CARE_EMAIL} and we will be happy to help.`],
    ],
  },
  {
    group: 'Products & Craft',
    items: [
      ['Do sarees come with a blouse piece?', 'This varies by product. Please check the individual product description for details on whether a blouse piece is included.'],
      ['Do you offer fall, pico or blouse stitching?', "No, we don't provide this service."],
      ['Can I place an order over WhatsApp?', 'For now, we recommend placing orders directly through the Sutaara website to ensure that your order and payment are recorded correctly. If you need help selecting a product or placing an order, you can reach out to us and we will guide you through the process.'],
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'is-open' : ''}`}>
      <button className="faq-item__q" onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <span className="faq-item__icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-item__a">{a}</div>}
    </div>
  );
}

export default function Faq() {
  return (
    <>
      <div className="page-head">
        <h1>Frequently Asked Questions</h1>
        <div className="crumbs"><Link to="/">Home</Link> / <span>FAQ</span></div>
      </div>
      <section className="section--tight">
        <div className="container">
          <div className="faq">
            {FAQ_SECTIONS.map((sec) => (
              <div key={sec.group} className="faq-group">
                <h2>{sec.group}</h2>
                {sec.items.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
              </div>
            ))}
            <div className="faq-help">
              <p>Still have a question? Reach us at <a href={`mailto:${CARE_EMAIL}`}>{CARE_EMAIL}</a> or WhatsApp <a href="https://wa.me/919569659272" target="_blank" rel="noreferrer">9569659272</a> — please keep your Order ID handy.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
