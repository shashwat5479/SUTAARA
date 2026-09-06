import { useParams, Link } from 'react-router-dom';

const EMAIL = 'sutara.lucknow@gmail.com';
const PHONE = '9569659272';
const WA = 'https://wa.me/919569659272';

function ContactLine() {
  return (
    <p>
      Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or WhatsApp{' '}
      <a href={WA} target="_blank" rel="noreferrer">{PHONE}</a> with your order details.
    </p>
  );
}

function Shipping() {
  return (
    <>
      <p className="policy__lead">
        At Sutaara, every order is carefully packed and prepared before it begins its journey to you.
        We aim to ensure your purchase reaches you safely and within the expected delivery timeframe.
        We ship throughout the week, except on Sundays and public holidays.
      </p>

      <h2>Domestic Shipping — India</h2>
      <ul>
        <li><strong>Shipping Charges:</strong> A flat shipping fee of ₹100 applies to orders within India, irrespective of the number of items purchased.</li>
        <li><strong>Free Shipping:</strong> Shipping is free on orders above ₹4999.</li>
        <li><strong>Taxes:</strong> All prices displayed on our website are inclusive of applicable taxes, including GST.</li>
        <li><strong>Order Dispatch:</strong> Orders are generally dispatched within 3–4 working days of order confirmation. During sales, festive periods or high-volume periods, dispatch may take 5–7 working days.</li>
        <li><strong>Delivery Timeline:</strong> Once dispatched, orders typically reach you within 7 working days, depending on the delivery location and courier service availability.</li>
        <li><strong>Order Tracking:</strong> Once your order has been dispatched, tracking details will be shared with you on email and WhatsApp.</li>
      </ul>

      <h3>Delivery Address</h3>
      <p>
        Orders will be delivered to the address provided at checkout. Once an order has been dispatched,
        we may not be able to modify the delivery details. If you need to make a change to your delivery
        address, please contact us within 2 hours of placing your order — kindly drop us a mail at{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>

      <h3>Handcrafted &amp; Made-to-Order Products</h3>
      <p>
        Certain handcrafted, customised, finished or made-to-order pieces may require additional
        processing time. Where applicable, this will be mentioned on the respective product page or
        communicated to you.
      </p>

      <h2>International Shipping</h2>
      <p>
        We currently accept international orders via WhatsApp. Please contact us at{' '}
        <a href={WA} target="_blank" rel="noreferrer">{PHONE}</a> to place your order. Shipping charges
        will vary depending on the destination and package weight and will be borne by the customer.
      </p>

      <h2>Delays in Delivery</h2>
      <p>
        While we make every effort to deliver your order within the estimated timeframe, occasional
        delays may occur due to courier disruptions, weather conditions, public holidays, customs
        clearance, remote delivery locations or other circumstances beyond our control. We will always
        do our best to assist you in case of any delivery-related issue.
      </p>

      <h2>Need Help?</h2>
      <p>For any questions regarding your order, shipping or delivery, please contact us:</p>
      <ContactLine />
    </>
  );
}

function Returns() {
  return (
    <>
      <h2>Sale &amp; Discounted Products</h2>
      <p>
        Products purchased on sale, discount or under special promotional offers are not eligible for
        return or exchange.
      </p>

      <h2>Cancellation Policy</h2>
      <p>
        If you wish to cancel your order, please contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>{' '}
        within 24 hours of placing the order.
      </p>
      <ul>
        <li>If the order has not yet been dispatched, we will cancel it and issue a full refund.</li>
        <li>Once an order has been dispatched, it cannot be cancelled.</li>
        <li>Orders that have been customised, altered, finished or prepared specially at your request cannot be cancelled once processing has begun.</li>
      </ul>

      <h2>Return &amp; Exchange Policy</h2>
      <p>We accept returns or exchanges only in the following cases:</p>
      <ul>
        <li>You have received an incorrect product.</li>
        <li>The product has arrived damaged or defective.</li>
      </ul>
      <p>
        Please contact us within 48 hours of receiving your order, along with your Order ID and clear
        photographs/videos of the product and packaging. Once the request has been reviewed and
        approved, we will guide you through the return or replacement process.
      </p>
      <p>The product must be:</p>
      <ul>
        <li>Unused and unworn</li>
        <li>Unwashed</li>
        <li>Unaltered</li>
        <li>Returned with all original tags attached</li>
        <li>Returned in its original packaging</li>
      </ul>
      <p>
        Products that do not meet these conditions may not be eligible for return or exchange. Any
        return or exchange request made after 48 hours of delivery will not be eligible for
        consideration.
      </p>

      <h2>Products Not Eligible for Return or Exchange</h2>
      <p>Returns or exchanges will not be accepted for:</p>
      <ul>
        <li>Products that have been worn, washed, altered or damaged after delivery</li>
        <li>Products returned without original tags or packaging</li>
        <li>Customised, made-to-order or personalised products</li>
        <li>Products purchased during clearance or final-sale promotions</li>
        <li>Products damaged due to improper handling, storage or washing</li>
      </ul>

      <h2>A Note on Handcrafted Products</h2>
      <p>
        Wouldn't you agree that the little irregularities are often what make handcrafted pieces
        special? With most Sutaara pieces being handwoven or handcrafted, slight variations in weave,
        texture, print, embroidery or colour are completely natural. They are part of the making
        process, not defects. You may also notice small differences in colour depending on lighting,
        photography or your screen — all part of the individual character of each piece.
      </p>

      <h2>Damaged Packaging</h2>
      <p>
        If the outer packaging appears significantly damaged, opened or tampered with at the time of
        delivery, we recommend refusing the shipment wherever possible. If you notice damage after
        accepting the package, please contact us within 48 hours, along with photographs or an unboxing
        video where available.
      </p>

      <h2>Refund Policy</h2>
      <p>
        Once a cancellation or return has been approved, the refund will be processed to the original
        mode of payment. Refunds are generally initiated within 7–10 working days of approval or receipt
        and inspection of the returned product. The time taken for the amount to reflect in your account
        may vary depending on your bank or payment provider. Original shipping charges, where
        applicable, will be refundable where the product delivered was incorrect, damaged or defective.
      </p>

      <h2>Need Help?</h2>
      <p>For cancellations, returns or delivery-related concerns, please contact us with your Order ID and relevant photographs:</p>
      <ContactLine />
      <p className="policy__fine">
        All returns, exchanges and refunds are subject to verification by Sutaara and applicable
        consumer laws.
      </p>
    </>
  );
}

function Contact() {
  return (
    <>
      <p className="policy__lead">
        If you have any more questions regarding our work, your order, or you'd like to collaborate
        with us, our team would love to hear from you.
      </p>
      <h2>Get in touch</h2>
      <ul>
        <li><strong>Email:</strong> <a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
        <li><strong>WhatsApp / Phone:</strong> <a href={WA} target="_blank" rel="noreferrer">{PHONE}</a></li>
      </ul>
      <p>
        For order-related queries, please include your Order ID so we can help you faster. We're based
        in Lucknow and reply through the week, except on Sundays and public holidays.
      </p>
    </>
  );
}

const PAGES = {
  shipping: { title: 'Shipping & Delivery Policy', crumb: 'Shipping & Delivery', body: <Shipping /> },
  returns: { title: 'Cancellation, Return & Refund Policy', crumb: 'Returns & Refunds', body: <Returns /> },
  contact: { title: 'Contact Us', crumb: 'Contact', body: <Contact /> },
};

export default function Policy({ which }) {
  const params = useParams();
  const key = which || params.which || 'shipping';
  const page = PAGES[key] || PAGES.shipping;

  return (
    <>
      <div className="page-head">
        <h1>{page.title}</h1>
        <div className="crumbs">
          <Link to="/">Home</Link> / <span>{page.crumb}</span>
        </div>
      </div>
      <section className="section--tight">
        <div className="container">
          <div className="policy">{page.body}</div>
        </div>
      </section>
    </>
  );
}
