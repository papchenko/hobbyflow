import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
// context
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
// nav
import Nav from './components/nav/Nav';
// home
import Home from './components/pages/home/Home';
// books
import Books from './components/pages/books/Books';
import { FavoritesProvider } from "./context/FavoritesContext";
// takers
import Takers from './components/pages/takers/Takers';
import TakerDetails from './components/pages/takers/TakerDetails';
// about
import About from './components/pages/about/About';
// notfound
import NotFound from './components/pages/404/NotFound';
// cart
import CartModal from './components/cart/CartModal';
import ProductModal from './components/cart/ProductModal';
import { CheckoutPayment } from "./components/cart/CheckoutPayment";
import OrderDetailsPage from "./components/cart/OrderDetailsPage";
import SellerOrdersPage from "./components/cart/SellerOrdersPage";
import BuyerOrdersPage from "./components/cart/BuyerOrdersPage";
// auth
import { AuthProvider } from './context/AuthContext';
//profile
import Profile from './components/pages/profile/Profile';
// premium
import GetTakersPremium from './components/pages/premium/GetTakersPremium';
import GetTakersPremiumPayment from './components/pages/premium/GetTakersPremiumPayment';
// admin
import AdminPremiumPanel from './components/pages/admin/AdminPremiumPanel';
// footer
import Footer from './components/footer/Footer';
// scroll
import ScrollToTop from './components/scroll/ScrollToTop';
// notifications
import SellerNotifications from "./components/notifications/SellerNotifications";
import BuyerNotifications from "./components/notifications/BuyerNotifications";
// reader
import UniversalBookReader from "./components/reader/UniversalBookReader";
// legal
import TermsOfUse from "./components/pages/legal/TermsOfUse";
import PrivacyPolicy from "./components/pages/legal/PrivacyPolicy";
import CookiePolicy from "./components/pages/legal/CookiePolicy";
import CookieBanner from "./components/pages/legal/CookieBanner";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <CartProvider>
         <FavoritesProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <SellerNotifications />
            <BuyerNotifications />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/books" element={<Books />} />
                <Route path="/takers" element={<Takers />} />
                <Route path="/takers/:id" element={<TakerDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/takers-premium" element={<GetTakersPremium />} />
                <Route path="/payment/takers-premium" element={<GetTakersPremiumPayment />} />
                <Route path="/admin" element={<AdminPremiumPanel />} />
                <Route path="/checkout-payment" element={<CheckoutPayment />} />
                <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
                <Route path="/seller/orders" element={<SellerOrdersPage />} />
                <Route path="/buyer/orders" element={<BuyerOrdersPage />} />
                <Route path="/terms" element={<TermsOfUse />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/reader" element={<UniversalBookReader />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <CartModal />
            <ProductModal />
            <ScrollToTop />
          </div>
          <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
          <CookieBanner />
        </Router>
        </FavoritesProvider>
      </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;