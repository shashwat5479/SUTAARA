import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout, { ProtectedRoute } from './components/Layout.jsx';
import Home from './pages/Home.jsx';
const Shop = lazy(() => import('./pages/Shop.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const LoginCallback = lazy(() => import('./pages/LoginCallback.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Studio = lazy(() => import('./pages/Studio.jsx'));
const Story = lazy(() => import('./pages/Story.jsx'));
const EditPage = lazy(() => import('./pages/EditPage.jsx'));
const Diaries = lazy(() => import('./pages/Diaries.jsx'));
const Exhibition = lazy(() => import('./pages/Exhibition.jsx'));
const Policy = lazy(() => import('./pages/Policy.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="login" element={<Login />} />
        <Route path="login/callback" element={<LoginCallback />} />
        <Route path="register" element={<Register />} />
        <Route path="studio" element={<Studio />} />
        <Route path="story" element={<Story />} />
        <Route path="edits/:id" element={<EditPage />} />
        <Route path="diaries" element={<Diaries />} />
        <Route path="exhibition" element={<Exhibition />} />
        <Route path="shipping-policy" element={<Policy which="shipping" />} />
        <Route path="returns-policy" element={<Policy which="returns" />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="privacy-policy" element={<Legal which="privacy" />} />
        <Route path="terms" element={<Legal which="terms" />} />
        <Route path="disclaimer" element={<Legal which="disclaimer" />} />

        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-success/:id"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="account/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}