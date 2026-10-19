import { useEffect, useRef, useState } from "react";
import { useCart } from "../../../../context/CartContext";
import { useAuth } from "../../../../context/AuthContext";
import { db } from "../../../../firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { FaArrowLeft, FaArrowRight, FaGift, FaShoppingCart } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import { shop } from "../../../../Data/shop";
import ShopProductModal from "./ShopProductModal";

import "swiper/css";
import "swiper/css/navigation";

import './shop.scss';

const Shop = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [hasCompletedShopOrder, setHasCompletedShopOrder] = useState(false);
  const [selectedShopProduct, setSelectedShopProduct] = useState(null);

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const checkShopOrder = async () => {
      if (!user?.uid) {
        setHasCompletedShopOrder(false);
        return;
      }

      try {
        const ordersRef = collection(db, "orders");

        const q = query(
          ordersRef,
          where("buyerId", "==", user.uid),
          where("type", "==", "shop"),
          limit(1)
        );

        const snapshot = await getDocs(q);

        setHasCompletedShopOrder(!snapshot.empty);
      } catch (error) {
        console.error("Error checking shop orders:", error);
        setHasCompletedShopOrder(false);
      }
    };

    checkShopOrder();
  }, [user]);

  useEffect(() => {
    if (
      !swiperRef.current ||
      !prevRef.current ||
      !nextRef.current
    ) {
      return;
    }

    const swiper = swiperRef.current;

    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;

    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();

    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      type: "shop",
      quantity: 1,
      image: item.image,
    });
  };

  return (
    <>
      <section className="shop-section">
        <div className="shop-section__container">

          {/* HEADER */}
          <div className="shop-section__top">
            <div className="shop-section__title-wrap">
              <span className="shop-section__eyebrow">
                HobbyFlow STORE
              </span>

              <h2 className="shop-section__title">
                Stories worth 
                <span>keeping.</span>
              </h2>
            </div>

            <div className="shop-section__intro-wrap">
              <p className="shop-section__intro">
                Thoughtfully designed HobbyFlow pieces
                for your everyday reading ritual.
              </p>

              {!hasCompletedShopOrder && (
                <div className="shop-section__first-order-badge">
                  <span className="shop-section__first-order-icon">
                    <FaGift />
                  </span>

                  <span>
                    Get bonuses on your first order!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCTS */}
          <div className="shop-section__products">
            <Swiper
              className="shop-section__swiper"
              modules={[Autoplay, Navigation]}
              spaceBetween={22}
              loop={shop.length > 3}
              breakpoints={{
                0: {
                  slidesPerView: 1.15,
                },
                520: {
                  slidesPerView: 2,
                },
                850: {
                  slidesPerView: 2.5,
                },
                1150: {
                  slidesPerView: 3,
                },
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
            >
              {shop.map((item) => (
                <SwiperSlide key={item.id}>
                  <article
                    className="shop-item"
                    onClick={() => setSelectedShopProduct(item)}
                  >
                    {/* VISUAL */}
                    <div className="shop-item__visual">
                      <div className="shop-item__badge">
                        HobbyFlow
                      </div>

                      <img
                        src={item.image}
                        alt={item.name}
                        className="shop-item__image"
                      />

                      <button
                        type="button"
                        className="shop-item__quick-add"
                        aria-label={`Add ${item.name} to cart`}
                        onClick={(e) => handleAddToCart(e, item)}
                      >
                        <FaShoppingCart className="add-btn-shop" />
                      </button>
                    </div>

                    {/* DETAILS */}
                    <div className="shop-item__details">
                      <div className="shop-item__name-row">
                        <h3>{item.name}</h3>

                        <span className="shop-item__price">
                          {item.price} ₴
                        </span>
                      </div>

                      <p>{item.title}</p>

                      <button
                        type="button"
                        className="shop-item__view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShopProduct(item);
                        }}
                      >
                        <span>View details</span>
                        <span className="shop-item__arrow">
                          ↗
                        </span>
                      </button>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* BOTTOM NAVIGATION */}
          <div className="shop-section__bottom">
            <div className="shop-section__progress">
              <span />
            </div>

            <div className="shop-section__controls">
              <button
                ref={prevRef}
                type="button"
                aria-label="Previous product"
              >
                <FaArrowLeft />
              </button>

              <button
                ref={nextRef}
                type="button"
                aria-label="Next product"
              >
                <FaArrowRight />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* PRODUCT MODAL */}
      {selectedShopProduct && (
        <ShopProductModal
          product={selectedShopProduct}
          onClose={() => setSelectedShopProduct(null)}
        />
      )}
    </>
  );
};

export default Shop;