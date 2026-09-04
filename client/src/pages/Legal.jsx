import { useParams, Link } from 'react-router-dom';

const CARE_EMAIL = 'care@sutaara.com';

function Privacy() {
  return (
    <>
      <p className="policy__lead">
        Sutaara ("we", "us", "our") is committed to protecting your privacy. This policy explains what
        information we collect when you use our website, how we use it, and the choices you have.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li><b>Details you provide:</b> name, email, phone number, shipping and billing address, and order details when you shop, create an account, or contact us.</li>
        <li><b>Automatic information:</b> device, browser, and usage data collected through cookies and similar technologies to help the site function and improve.</li>
        <li><b>Payment information:</b> processed securely by our payment partners. We do not store your full card or bank details on our servers.</li>
      </ul>
      <h2>How we use your information</h2>
      <ul>
        <li>To process and deliver your orders, and send order updates.</li>
        <li>To respond to your enquiries and provide customer support.</li>
        <li>To improve our website, products and services.</li>
        <li>To send you updates or offers, where you have chosen to receive them.</li>
        <li>To meet legal, tax and regulatory obligations.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use cookies to keep your cart, remember preferences, and understand how the site is used. You can control cookies through your browser settings; disabling them may affect some features.</p>
      <h2>Sharing your information</h2>
      <p>We share information only as needed to run the store — with delivery partners, payment processors, and service providers who help operate the website — and where required by law. We do not sell your personal information.</p>
      <h2>Data security</h2>
      <p>We take reasonable technical and organisational measures to protect your information. No method of transmission over the internet is completely secure, but we work to safeguard your data.</p>
      <h2>Your rights</h2>
      <p>You may request access to, correction of, or deletion of your personal information, and you may opt out of marketing messages at any time. To make a request, contact us at <a href={`mailto:${CARE_EMAIL}`}>{CARE_EMAIL}</a>.</p>
      <h2>Contact</h2>
      <p>For any privacy-related questions, email <a href={`mailto:${CARE_EMAIL}`}>{CARE_EMAIL}</a>.</p>
      <p className="policy__fine">This policy may be updated from time to time. Please review it periodically. This is a general policy template and should be reviewed by a legal professional before final use.</p>
    </>
  );
}

function Terms() {
  return (
    <>
      <p className="policy__lead">These Terms &amp; Conditions govern your use of the Sutaara website and your purchases from us. By using the site, you agree to these terms.</p>
      <h2>Use of the website</h2>
      <p>You agree to use the website lawfully and not to misuse it, attempt to disrupt it, or infringe its content. All content — images, text, designs and logos — belongs to Sutaara and may not be used without permission.</p>
      <h2>Products &amp; pricing</h2>
      <ul>
        <li>We make every effort to display products, colours and details accurately, though slight variations are natural in handcrafted pieces and screens may show colours differently.</li>
        <li>Prices are listed in Indian Rupees and are inclusive of applicable taxes. We may update prices and availability without notice.</li>
        <li>We reserve the right to limit quantities, refuse or cancel an order, or correct pricing errors.</li>
      </ul>
      <h2>Orders &amp; payment</h2>
      <p>An order is confirmed once payment is received and you receive a confirmation. Payment is handled securely through our payment partners.</p>
      <h2>Shipping, returns &amp; cancellations</h2>
      <p>These are governed by our Shipping &amp; Delivery Policy and Cancellation, Return &amp; Refund Policy, which form part of these terms.</p>
      <h2>Limitation of liability</h2>
      <p>To the extent permitted by law, Sutaara is not liable for indirect or consequential losses arising from the use of the website or products, beyond the value of the order concerned.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and any disputes are subject to the jurisdiction of the courts of Lucknow, Uttar Pradesh.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Email <a href={`mailto:${CARE_EMAIL}`}>{CARE_EMAIL}</a>.</p>
      <p className="policy__fine">This is a general template and should be reviewed by a legal professional before final use.</p>
    </>
  );
}

function Disclaimer() {
  return (
    <>
      <p className="policy__lead">The information on this website is provided in good faith for general information about Sutaara and its products.</p>
      <h2>Handcrafted products</h2>
      <p>Most Sutaara pieces are handwoven or handcrafted. Slight variations in weave, texture, print, embroidery or colour are natural and are part of the making process — they are not defects. Colours may appear slightly different depending on lighting, photography or your screen.</p>
      <h2>Accuracy of information</h2>
      <p>While we strive to keep product descriptions, pricing and availability accurate and up to date, we do not warrant that all information is complete or error-free, and we may correct any errors at any time.</p>
      <h2>External links</h2>
      <p>Our website may contain links to third-party sites. We are not responsible for the content or practices of those sites.</p>
      <h2>Contact</h2>
      <p>For any clarification, email <a href={`mailto:${CARE_EMAIL}`}>{CARE_EMAIL}</a>.</p>
      <p className="policy__fine">This is a general template and should be reviewed by a legal professional before final use.</p>
    </>
  );
}

const PAGES = {
  privacy: { title: 'Privacy Policy', crumb: 'Privacy Policy', body: <Privacy /> },
  terms: { title: 'Terms & Conditions', crumb: 'Terms & Conditions', body: <Terms /> },
  disclaimer: { title: 'Disclaimer', crumb: 'Disclaimer', body: <Disclaimer /> },
};

export default function Legal({ which }) {
  const params = useParams();
  const key = which || params.which || 'privacy';
  const page = PAGES[key] || PAGES.privacy;
  return (
    <>
      <div className="page-head">
        <h1>{page.title}</h1>
        <div className="crumbs"><Link to="/">Home</Link> / <span>{page.crumb}</span></div>
      </div>
      <section className="section--tight">
        <div className="container">
          <div className="policy">{page.body}</div>
        </div>
      </section>
    </>
  );
}
