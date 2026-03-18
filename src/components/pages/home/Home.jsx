import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../cart/ProductCard";
import { shop } from "../../../Data/shop";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../firebase";
import ProductModal from "../../cart/ProductModal";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import ShopProductModal from "./ShopProductModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import logoImg from "../../../assets/logo.svg";
// swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Home = () => {
  
  const [latestBooks, setLatestBooks] = useState([]);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedShopProduct, setSelectedShopProduct] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchLatestBooks = async () => {
      try {
        const q = query(
          collection(db, "books"),
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const snap = await getDocs(q);

        const books = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLatestBooks(books);
      } catch (error) {
        console.error("Error fetching latest books:", error);
      }
    };

    fetchLatestBooks();
  }, []);

  useEffect(() => {
    if (!swiperRef.current || !prevRef.current || !nextRef.current) return;

    const swiper = swiperRef.current;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.init();
    swiper.navigation.update();
  }, [swiperRef.current]);

    useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsToShow(3);
      } else {
        setItemsToShow(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePremiumClick = () => {
    if (!user) {
      toast.info("Please sign in to access Premium");
      return;
    }

    navigate("/takers-premium");
  };

  return (
    <div>
      {/* HERO SLIDER */}
      <section className="relative w-full overflow-hidden">
        <Swiper
          className="home-swiper w-full h-[70vh] sm:h-screen"
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          autoplay={{
            delay: 20000,
            disableOnInteraction: false,
          }}
          loop={true}
          pagination={{ clickable: true }}
        >
          {/* SLIDE 1 */}
          <SwiperSlide>
            <div className="w-full h-full flex flex-col justify-center items-center text-center text-white bg-gradient-to-br
              from-[#e0f2fe]
              via-[#bae6fd]
              to-[#7dd3fc]

              dark:from-[#111018]
              dark:via-[#1b1a2b]
              dark:to-[#1c2a3a]">

              <div className="px-4 max-w-7xl">

                <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-800 dark:text-white">
                  Share Knowledge, Inspire Others
                </h1>

                <p className="text-2xl sm:text-xl md:text-2xl lg:text-3xl mb-12 max-w-3xl mx-auto text-gray-800 dark:text-white">
                  Here you can sell books, lend them as collateral — instead of letting them gather dust on your shelf.
                </p>

                <Link
                  to="/books"
                  className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] py-4 px-9 sm:px-10 rounded-full font-bold transition duration-300"
                >
                  Explore Library
                </Link>

              </div>
            </div>
          </SwiperSlide>
          {/* SLIDE 2 PREMIUM */}
          <SwiperSlide>
            <div className="w-full h-full flex flex-col justify-center items-center text-center bg-gradient-to-br
              from-[#e0f2fe]
              via-[#bae6fd]
              to-[#7dd3fc]

              dark:from-[#111018]
              dark:via-[#1b1a2b]
              dark:to-[#1c2a3a] dark:text-white">
              <div className="px-4 max-w-4xl">
                <h2 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-800 dark:text-white">
                  Unlock Taker Premium
                </h2>
                <p className="text-2xl sm:text-xl md:text-2xl lg:text-3xl mb-12 max-w-3xl mx-auto text-gray-800 dark:text-white">
                  Want to lend or sell books for a specific period? Activate Premium, gain full control over listings, and unlock all platform features for maximum reach and engagement.
                </p>
                <button
                  onClick={handlePremiumClick}
                  className="inline-block bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white font-bold py-3 px-8 rounded-full transition duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>
          </SwiperSlide>
          {/* SLIDE 3 */}
          <SwiperSlide>
            <div className="w-full h-full flex flex-col justify-center items-center text-center bg-gradient-to-br
              from-[#e0f2fe]
              via-[#bae6fd]
              to-[#7dd3fc]

              dark:from-[#111018]
              dark:via-[#1b1a2b]
              dark:to-[#1c2a3a] dark:text-white">

              <div className="px-4 max-w-4xl">
                
                <div className=" flex flex-col items-center gap-1 justify-center text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-800 dark:text-white">
                  {/* <img
                    src={logoImg}
                    alt="Logo"
                    className="logo-img-hero transition dark:invert w-28"
                  /> */}
                  Bookflow Reader
                </div>

                <p className="text-2xl sm:text-xl md:text-2xl lg:text-3xl mb-12 max-w-3xl mx-auto text-gray-800 dark:text-white">
                  Online book reader – from our service.
                  Upload, manage, and read your books with maximum comfort.
                </p>

                <button
                  onClick={() => navigate("/reader")}
                  className="inline-block bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white font-bold py-3 px-8 rounded-full transition duration-300"
                >
                  Start Reading
                </button>

              </div>
            </div>
          </SwiperSlide>
        </Swiper>

      </section>
      {/* Most New Section */}
      <section className="py-12 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Most New
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestBooks.slice(0, itemsToShow).map((book) => (
              <div key={book.id}>
               <ProductCard 
                  product={{ ...book, type: "book" }} 
                  onClick={() => setSelectedBook(book)} 
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Shop Section with Fully Horizontal Cards */}
      <section className="py-12 bg-slate-100 dark:bg-gray-900 relative overflow-visible">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
            Our Shop
          </h2>
          <p className="text-lg sm:text-xl text-center mb-6 md:mb-9 text-gray-600 dark:text-gray-300">
            Exclusive Branded Bookmarks Collection
          </p>

          {/* relative wrapper */}
          <div className="relative">
            <Swiper
              className="pt-4"
              modules={[Autoplay, Navigation]}
              spaceBetween={15}
              loop={true}
              breakpoints={{
                0: { slidesPerView: 1 },
                640: { slidesPerView: 1 },
                1024: { slidesPerView: 2 },
              }}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
            >
              {shop.map((item) => (
                <SwiperSlide key={item.id}>
                  <div
                    onClick={() => setSelectedShopProduct(item)}
                    className="cursor-pointer
                      bg-white dark:bg-gray-800
                      border border-gray-200 dark:border-gray-700
                      shadow-md hover:shadow-2xl
                      hover:-translate-y-1
                      transition-all duration-300
                      rounded-xl
                      flex flex-row items-center
                      p-4 sm:p-5"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-28 h-40 sm:w-40 sm:h-40 sm:mr-2 flex justify-center items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-base sm:text-lg mb-1">
                          {item.name}
                        </h3>
                        <p className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-base mb-2">
                          {item.price} ₴
                        </p>
                        <p className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm mb-3 line-clamp-3">
                          {item.title}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            type: "shop",
                            quantity: 1,
                            image: item.image,
                          });
                        }}
                        className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)]
                          text-white font-semibold px-5 py-2 rounded-full
                          transition duration-300 self-start sm:self-start"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation Arrows */}
            <button
              ref={prevRef}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-gray-100 dark:bg-gray-700
                text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FaArrowLeft />
            </button>

            <button
              ref={nextRef}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-gray-100 dark:bg-gray-700
                text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FaArrowRight />
            </button>
          </div>
        </div>
      </section>
      {selectedBook && (
        <ProductModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
      {selectedShopProduct && (
        <ShopProductModal
          product={selectedShopProduct}
          onClose={() => setSelectedShopProduct(null)}
        />
      )}
      
    </div>
  );
};

export default Home;