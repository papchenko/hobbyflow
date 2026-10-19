import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { FaStar } from "react-icons/fa6";
import { getBookConditionLabel } from "../../constants/bookMeta";

import "../../styles/bookMetaFields.scss";
import { FaFileAlt, FaLanguage } from "react-icons/fa";

const ProductCard = ({ product, onClick }) => {
  const [seller, setSeller] = useState(null);

  const [liveProduct, setLiveProduct] = useState(null);

useEffect(() => {
  if (!product?.id) return;

  const productRef = doc(db, "books", product.id);

  const unsubscribe = onSnapshot(
    productRef,
    (snapshot) => {
      if (snapshot.exists()) {
        setLiveProduct({
          id: snapshot.id,
          ...snapshot.data(),
        });
      } else {
        setLiveProduct(null);
      }
    },
    (error) => {
      console.error("Error listening to book:", error);
    }
  );

  return () => unsubscribe();
}, [product?.id]);

const currentProduct =
  liveProduct?.id === product?.id
    ? liveProduct
    : product;

  useEffect(() => {
    const fetchSeller = async () => {
      if (!product?.sellerId) return;

      const sellerSnap = await getDoc(doc(db, "users", product.sellerId));
      if (sellerSnap.exists()) {
        const data = sellerSnap.data();
        setSeller({
          name: data.name || "Unknown",
          photoURL: data.photoURL || null,
          sellerStats: data.sellerStats || {
            completedOrders: 0,
            ratingAverage: 0,
            ratingCount: 0,
          },
        });
      }
    };

    fetchSeller();
  }, [product]);

const listingType =
  currentProduct.listingType ??
  (
    (
      currentProduct.isLendingAvailable ??
      (Number(currentProduct.priceLending) > 0)
    )
      ? "sale_and_rental"
      : "sale"
  );

const isRentalOnly = listingType === "rental_only";

const isLendingAvailable = listingType !== "sale";

  return (
    <div
      className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={onClick}>
      <div className="h-80 overflow-hidden rounded-t-lg relative">
        <img
          src={product.images?.[0] || ""}
          alt={product.name}
          className="w-full h-full object-contain"
        />
        {/* COMIC BADGE */}

        <div
          className="
            absolute
            top-3
            left-3
            flex
            items-center
            gap-1.5
            px-2.5
            py-1
            rounded-full
            bg-[var(--secondary-color)]
            text-white
            text-xs
            font-bold
            shadow-md
          ">
          BOOKS
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
          Genre: {product.genre}
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {product.pages && (
            <div className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
              <FaFileAlt /> {Number(product.pages)} pages
            </div>
          )}

          {product.language && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>

              <span className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
                <FaLanguage /> {product.language}
              </span>
            </>
          )}
        </div>

        {product.condition && (
          <div className="mb-2">
            <span
              className="book-condition-badge"
              data-condition={product.condition}>
              {getBookConditionLabel(product.condition)}
            </span>
          </div>
        )}
{!isRentalOnly && (
  <p className="text-base font-bold text-gray-800 dark:text-white mb-1">
    {Number(currentProduct.price || 0).toFixed(2)} ₴
  </p>
)}

{currentProduct.isCurrentlyRented === true && (
  <p className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
    Currently rented
  </p>
)}




{isLendingAvailable &&
  Number(currentProduct.priceLending) > 0 && (
    <>
      <span className="text-xs text-gray-800 dark:text-white">
        {isRentalOnly ? "Rental price:" : "Lending price:"}
      </span>

      <p className="text-green-600 dark:text-green-500 font-bold pb-2">
        {Number(currentProduct.priceLending).toFixed(2)} ₴

        {currentProduct.unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            / {currentProduct.unit}
          </span>
        )}
      </p>

      <div className="book-card__rentals text-gray-400 dark:text-gray-500">
        Successful rentals:{" "}
        <span
          className={
            Number(currentProduct.successfulRentals) > 0
              ? "text-green-600 dark:text-green-500"
              : "text-gray-400 dark:text-gray-500"
          }
        >
          {currentProduct.successfulRentals || 0}
        </span>
      </div>
    </>
)}


        {seller && (
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
            {seller.photoURL ? (
              <img
                src={seller.photoURL}
                alt={seller.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                {seller.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-gray-800 dark:text-white">
                {seller.name}
              </p>
              <p className="text-sm flex items-center gap-1 text-gray-700 dark:text-white">
                Rating:{" "}
                {seller.sellerStats?.ratingCount > 0
                  ? seller.sellerStats.ratingAverage.toFixed(0)
                  : 0}{" "}
                <FaStar className="text-[var(--accept-color)]" />
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;