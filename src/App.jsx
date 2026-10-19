import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
// context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
// nav
import Nav from "./components/nav/Nav";
// home
import Home from "./components/pages/home/Home";
// books
import Books from "./components/pages/books/Books";
import { FavoritesProvider } from "./context/FavoritesContext";
import BookCollections from "./components/pages/books/collections/BookCollections";
import Comic from "./components/pages/books/Comics/Comic";
import BoardGames from "./components/pages/books/boardGames/BoardGames";
// takers
import Takers from "./components/pages/takers/Takers";
import TakerDetails from "./components/pages/takers/TakerDetails";
// about
import About from "./components/pages/about/About";
// notfound
import NotFound from "./components/pages/404/NotFound";
// cart
import CartModal from "./components/cart/CartModal";
import ProductModal from "./components/cart/ProductModal";
import { CheckoutPayment } from "./components/cart/CheckoutPayment";
import OrderDetailsPage from "./components/cart/OrderDetailsPage";
import SellerOrdersPage from "./components/cart/SellerOrdersPage";
import BuyerOrdersPage from "./components/cart/BuyerOrdersPage";
// auth
import { AuthProvider } from "./context/AuthContext";
//profile
import Profile from "./components/pages/profile/Profile";
// premium
import GetTakersPremium from "./components/pages/premium/GetTakersPremium";
import GetTakersPremiumPayment from "./components/pages/premium/GetTakersPremiumPayment";
// admin
import AdminPremiumPanel from "./components/pages/admin/AdminPremiumPanel";
// footer
import Footer from "./components/footer/Footer";
import HelpPage from "./components/footer/navigation/HelpPage";
// scroll
import ScrollToTop from "./components/scroll/ScrollToTop";
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

// club
import ClubPage from "./components/club/ClubPage";

import NewsPage from "./components/club/news/NewsPage";
import NewsDetails from "./components/club/news/NewsDetails";
import EditNews from "./components/club/news/EditNews";

import EventsPage from "./components/club/events/EventsPage";
import EventDetails from "./components/club/events/EventDetails";

import CommunityPage from "./components/club/community/CommunityPage";

// support
// support
import SupportChat from "./components/support/SupportChat";
import SupportAdmin from "./components/support/SupportAdmin";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <Router>
              <div className="min-h-screen flex flex-col">
                <Nav />
                {/* <SellerNotifications />
                <BuyerNotifications /> */}
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/books" element={<Books />} />
                    <Route
                      path="/book-collections"
                      element={<BookCollections />}
                    />
                    <Route path="/board-games" element={<BoardGames />} />
                    <Route path="/comics" element={<Comic />} />
                    <Route path="/takers" element={<Takers />} />
                    <Route path="/takers/:id" element={<TakerDetails />} />
                    <Route path="/info" element={<About />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/takers-premium"
                      element={<GetTakersPremium />}
                    />
                    <Route
                      path="/payment/takers-premium"
                      element={<GetTakersPremiumPayment />}
                    />
                    <Route path="/admin" element={<AdminPremiumPanel />} />
                    <Route path="/admin/support" element={<SupportAdmin />} />
                    <Route
                      path="/checkout-payment"
                      element={<CheckoutPayment />}
                    />
                    <Route
                      path="/orders/:orderId"
                      element={<OrderDetailsPage />}
                    />
                    <Route
                      path="/seller/orders"
                      element={<SellerOrdersPage />}
                    />
                    <Route path="/buyer/orders" element={<BuyerOrdersPage />} />
                    <Route path="/terms" element={<TermsOfUse />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route
                      path="/hobbyflow-reader"
                      element={<UniversalBookReader />}
                    />
                    <Route path="/help-page" element={<HelpPage />} />
                    <Route path="*" element={<NotFound />} />

                    <Route path="/club" element={<ClubPage />} />

                    <Route path="/club/news" element={<NewsPage />} />

                    <Route
                      path="/club/news/:newsId"
                      element={<NewsDetails />}
                    />
                    <Route
                      path="/club/news/:newsId/edit"
                      element={<EditNews />}
                    />

                    <Route path="/club/events" element={<EventsPage />} />

                    <Route
                      path="/club/events/:eventId"
                      element={<EventDetails />}
                    />

                    <Route path="/club/community" element={<CommunityPage />} />
                  </Routes>
                </main>
                <Footer />
                <CartModal />
                <ProductModal />
                <ScrollToTop />
              </div>
              <ToastContainer
                position="top-center"
                autoClose={1500}
                hideProgressBar={true}
                newestOnTop={false}
                icon={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
              <CookieBanner />
            </Router>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
