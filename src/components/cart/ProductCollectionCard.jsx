import { FaBook, FaStar } from "react-icons/fa6";

const ProductCollectionCard = ({ collection, seller, onClick }) => {
  const isSellerOnline = (lastSeen) => {
    if (!lastSeen?.toDate) return false;

    return Date.now() - lastSeen.toDate().getTime() < 60000;
  };

  return (
    <div
  onClick={onClick}
  className="
    w-full
    h-full
    flex
    flex-col
    bg-white
    dark:bg-gray-800
    rounded-lg
    overflow-hidden
    shadow-md
    hover:shadow-lg
    transition-all
    duration-300
    hover:scale-105
    cursor-pointer
    border
    border-gray-200
    dark:border-gray-700
  "
>
      {/* BOOK COVERS */}

      <div
        className="
          relative
          h-64
          p-3
          overflow-hidden
        "
      >
        <div
          className="
            h-full
            flex
            items-center
            justify-center
          "
        >
          {collection.books?.slice(0, 5).map((book, index) => (
            <div
              key={index}
              className="
                relative
                h-52
                w-24
                flex-shrink-0
                transition-transform
                duration-300
              "
              style={{
                zIndex: 10 - index,
                marginLeft: index === 0 ? 0 : "-18px",
                transform: `rotate(${
                  index === 0
                    ? -4
                    : index ===
                        Math.min(4, (collection.books || []).length - 1)
                      ? 4
                      : 0
                }deg)`,
              }}
            >
              <img
                src={book.image || book.images?.[0] || ""}
                alt={book.title || book.name || ""}
                className="
                  w-full
                  h-full
                  object-cover
                  rounded-md
                  p-4.5
                "
              />
            </div>
          ))}

          {collection.bookCount > 5 && (
            <div
              className="
                absolute
                right-3
                bottom-2
                bg-black/70
                text-white
                text-xs
                font-semibold
                px-3
                py-1.5
                rounded-full
              "
            >
              + {collection.bookCount - 5} more
            </div>
          )}
        </div>

        {/* COMPLETENESS */}

        <div
          className="
            absolute
            left-3
            top-3
            bg-[var(--primary-color)]
            text-white
            text-xs
            font-semibold
            px-3
            py-1.5
            rounded-full
            shadow
          "
        >
        {collection.completenessLabel}
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-4 flex flex-col flex-1">
        <h3
          className="
            text-lg
            font-bold
            text-gray-800
            dark:text-white
            line-clamp-2
          "
        >
          {collection.collectionName}
        </h3>

        {collection.seriesName && (
          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            {collection.seriesName}
          </p>
        )}

        {/* INFO */}

        <div
          className="
            flex
            items-center
            gap-2
            mt-2
            text-sm
            text-gray-500
            dark:text-gray-400
          "
        >
          <FaBook />

          <span>{collection.bookCount} books</span>

          {collection.genre && (
            <>
              <span>•</span>

              <span>{collection.genre}</span>
            </>
          )}
        </div>

        {/* PRICE */}

        <div className="mt-3">
          <span
            className="
              text-xs
              text-gray-500
              dark:text-gray-400
            "
          >
            Entire collection
          </span>

          <p
            className="
              text-xl
              font-bold
              text-gray-800
              dark:text-white
            "
          >
            {Number(collection.price || 0).toFixed(2)} ₴
          </p>
        </div>

        {/* SELLER */}

        {seller && (
          <div
            className="
                mt-auto
                pt-3
                border-t
                border-gray-200
                dark:border-gray-700
                flex
                items-center
                space-x-3
            "
            >
            {/* AVATAR */}

            <div className="relative shrink-0">
              {seller.photoURL ? (
                <img
                  src={seller.photoURL}
                  alt={seller.name}
                  className="
                    w-8
                    h-8
                    rounded-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-gray-300
                    dark:bg-gray-600
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  {seller.name?.charAt(0)?.toUpperCase()}
                </div>
              )}

              {/* ONLINE */}

              {isSellerOnline(seller.lastSeen) && (
                <span
                  className="
                    absolute
                    bottom-0
                    right-0
                    w-2.5
                    h-2.5
                    rounded-full
                    bg-green-500
                    border-2
                    border-white
                    dark:border-gray-800
                  "
                />
              )}
            </div>

            {/* SELLER INFO */}

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-800
                  dark:text-white
                "
              >
                {seller.name}
              </p>

              <p
                className="
                  text-xs
                  flex
                  items-center
                  gap-1
                  text-gray-600
                  dark:text-gray-300
                "
              >
                Rating:{" "}
                {seller.sellerStats?.ratingCount > 0
                  ? seller.sellerStats.ratingAverage.toFixed(0)
                  : 0}

                <FaStar className="text-[var(--accept-color)]" />
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCollectionCard;