import { useEffect } from "react";
import { useCart } from "../../../../context/CartContext";
import { FaTimes } from "react-icons/fa";
import { IoIosResize } from "react-icons/io";
import { RiWeightFill } from "react-icons/ri";

const ShopProductModal = ({ product, onClose }) => {
  const { addToCart } = useCart();

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart({
      ...product,
      type: "shop",
      quantity: 1,
      image: product.image,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="
            relative
            bg-white dark:bg-gray-800
            rounded-xl shadow-xl
            w-full
            max-w-2xl
            h-full
            md:h-auto
            md:max-h-[90vh]
            flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700"
        >
          <FaTimes />
        </button>

        <div
        className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="flex justify-center items-center">
            <img
              src={product.image}
              alt={product.name}
              className="w-full md:max-h-[400px] max-h-[280px] object-contain rounded-lg"
            />
          </div>

          {/* Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {product.name}
            </h2>

            <p className="text-green-600 dark:text-green-400 font-bold text-xl mb-1">
              {product.price} ₴
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {product.title}
            </p>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <IoIosResize /> Size: {product.size}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <RiWeightFill /> Weight: {product.weight}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Material: {product.material}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Thickness: {product.thickness}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Finish: {product.finish}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Collection: {product.collection}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Availability:{product.inStock} <span className="text-[var(--accept-color)]">in stock</span> 
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {product.description}
            </p>

            <button
              onClick={handleAddToCart}
              className="w-full py-3 rounded-full bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white font-medium transition"
            >
              Add To Cart
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ShopProductModal;