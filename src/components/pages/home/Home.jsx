import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../cart/ProductCard";
import { shop } from "../../../Data/shop";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../firebase";
import { supabase } from "../../../supabase";
import ProductModal from "../../cart/ProductModal";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast } from "react-toastify";
import ShopProductModal from "./ShopProductModal";
// import DonateModal from "./DonateModal";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Home = () => {
  
  const [latestBooks, setLatestBooks] = useState([]);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedShopProduct, setSelectedShopProduct] = useState(null);
  // const [isDonateOpen, setIsDonateOpen] = useState(false);
  // const [donors, setDonors] = useState([]);

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

  // useEffect(() => {
  // const fetchDonors = async () => {

  //   const { data, error } = await supabase
  //     .from("donations")
  //     .select("name, amount, created_at")
  //     .order("created_at", { ascending: false })
  //     .limit(10);

  //   if (error) {
  //     console.error("Error loading donors:", error);
  //     return;
  //   }

  //   setDonors(data);
  //   };

  //   fetchDonors();
  // }, []);

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

  return (
    <div>
      {/* HERO SLIDER */}
      <section className="relative w-full overflow-hidden">

          <Swiper
            className="home-swiper w-full h-[70vh] sm:h-screen"
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
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

                <p className="text-xl sm:text-xl md:text-2xl lg:text-3xl mb-12 max-w-3xl mx-auto text-gray-800 dark:text-white">
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
              dark:to-[#1c2a3a] text-gray-600 dark:text-white">

              <div className="px-4 max-w-4xl">

                <h2 className="text-5xl md:text-6xl font-bold mb-6">
                  Get Taker Premium
                </h2>

                <p className="text-2xl mb-10">
                  Want to sell or lend books for a specific time?
                  Complete full registration, activate premium and unlock the full power of the platform.
                </p>

                <Link
                  to="/takers-premium"
                  className="inline-block bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white font-bold py-3 px-8 rounded-full transition duration-300"
                >
                  View Details
                </Link>

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

      {/* Shop Section with Navigation */}
      <section className="py-12 bg-slate-100 dark:bg-gray-800 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Our Shop
          </h2>

          <Swiper
            modules={[Autoplay, Navigation]}
            slidesPerView={2}
            spaceBetween={10}
            loop={true}
            // autoplay={{ delay: 2500, disableOnInteraction: false }}
            onSwiper={(swiper) => (swiperRef.current = swiper)}>
            {shop.map((item) => (
              <SwiperSlide key={item.id}>
                <div
                  onClick={() => setSelectedShopProduct(item)}
                  className="cursor-pointer
                    bg-white
                    dark:bg-gray-700
                    border border-slate-200
                    dark:border-gray-600
                    shadow-sm
                    hover:shadow-xl
                    hover:-translate-y-1
                    transition-all duration-300
                    p-5
                    rounded-2xl
                    flex flex-col items-center text-center
                  "
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-36 object-contain mb-4"
                  />
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-green-600 dark:text-green-400 font-bold mb-1">
                    {item.price} ₴
                  </p>
                  <p className="text-gray-500 dark:text-gray-300 text-sm mb-3">
                    {item.title}
                  </p>
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
                    className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white px-4 py-2 rounded-full transition duration-300"
                  >
                    Buy
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            ref={prevRef}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FaArrowLeft />
          </button>
          <button
            ref={nextRef}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-10 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FaArrowRight />
          </button>
        </div>
      </section>
      {/* Donate Section */}
      {/* <section className="py-12 bg-gradient-to-br
        from-[#e0f2fe]
        via-[#bae6fd]
        to-[#7dd3fc]

        dark:from-[#111018]
        dark:via-[#1b1a2b]
        dark:to-[#1c2a3a] 
        text-gray-600 dark:text-white">

        <div className="container mx-auto px-4 text-center">

          <h2 className="text-3xl font-bold mb-4">
            Support Us
          </h2>

          <p className="text-2xl mb-6">
            Our project is constantly improving.  
            Your support helps us grow!
          </p>

          <button
            onClick={() => setIsDonateOpen(true)}
            className="inline-block bg-[var(--accept-color)] hover:bg-[var(--accept-color-hover)] text-white font-bold py-2 px-6 rounded-full transition duration-300">
            Donate
          </button>

          {donors.length > 0 && (
            <div className="mt-10 max-w-4xl mx-auto">

              <h3 className="text-xl font-semibold mb-6">
                Recent Supporters
              </h3>

              <Swiper
                modules={[Autoplay]}
                slidesPerView={1}
                spaceBetween={15}
                loop={true}
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false
                }}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 }
                }}
              >
                {donors.map((donor, index) => (
                  <SwiperSlide key={index}>
                    <div className="
                      bg-white
                      dark:bg-gray-700
                      rounded-xl
                      shadow
                      px-4
                      py-2
                      flex
                      flex-col
                      items-center
                      justify-center
                    ">
                      <div className="text-base font-semibold text-gray-800 dark:text-white">
                        {donor.name}
                      </div>
                      {donor.amount && (
                        <div className="text-base text-green-500 font-bold mt-1">
                          {donor.amount} ₴
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      </section>
      <DonateModal
        isOpen={isDonateOpen}
        setIsOpen={setIsDonateOpen}
      /> */}
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