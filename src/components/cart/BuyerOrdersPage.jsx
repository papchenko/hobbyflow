import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaHandshakeSimple } from "react-icons/fa6";

const BuyerOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    });

    return () => unsub();
  }, [user]);

  if (!user) return <p className="p-4">Login required</p>;

  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return "";
    return cardNumber.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Card number copied");
  };

  return (
    <div className="md:py-6 bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] dark:bg-gradient-to-br dark:from-[#111018] dark:via-[#1b1a2b] dark:to-[#1c2a3a] text-gray-600 dark:text-white">
      <div className="max-w-7xl mx-auto p-4 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">My purchases</h2>

        {orders.length === 0 ? (
          <p>You have no orders yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              // const totalAmount = order.items?.reduce(
              //   (sum, item) =>
              //     sum + (item.purchaseType === "rental" ? item.priceLending : item.price),
              //   0
              // );
              const totalAmount = order.items?.reduce(
  (sum, item) =>
    sum +
    Number(
      item.finalPrice ??
      (
        item.purchaseType === "rental"
          ? item.priceLending
          : item.price
      )
    ),
  0
);

              return (
                <div
                  key={order.id}
                  className="border p-3 rounded hover:shadow cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <p><b>Number:</b> {order.id}</p>
                  <p>
                    <b>Book:</b> {order.items?.[0]?.name} (
                    {order.items?.[0]?.purchaseType === "rental" ? "Lending" : "Buy"} —{" "}
                    {/* {order.items?.[0]?.purchaseType === "rental"
                      ? order.items?.[0]?.priceLending
                      : order.items?.[0]?.price} ₴ */}
                      {order.items?.[0]?.finalPrice ??
(
  order.items?.[0]?.purchaseType === "rental"
    ? order.items?.[0]?.priceLending
    : order.items?.[0]?.price
)} ₴
                    )
                  </p>
                  <p><b>Total Sum:</b> {totalAmount} ₴</p>
<div>
  <p>
    <b>Status:</b>{" "}
    {order.status === "pending"
      ? "Waiting"
      : order.status === "accepted"
      ? "Accepted"
      : order.status === "rejected"
      ? "Rejected"
      : order.status || "—"}
  </p>

  {order.tradeId && (
    <div className="flex gap-2 items-center text-green-600 font-semibold mt-1">
      <FaHandshakeSimple className="text-base text-gray-700 dark:text-white" />
      Purchased after successful trade
    </div>
  )}
</div>

                  {order.status === "accepted" && order.buyerNotification && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm flex flex-col gap-1">
                      <div className="flex items-center justify-between md:justify-start">
                        <p>
                          <b>Seller card number:</b>{" "}
                          <span className="text-[var(--secondary-color)]">
                            {formatCardNumber(order.buyerNotification.cardNumber)}
                          </span>
                        </p>
                        <FaRegCopy
                          className="ml-2 cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(order.buyerNotification.cardNumber);
                          }}
                        />
                      </div>

                      {order.buyerNotification.bankName && (
                        <p><b>Bank:</b> {order.buyerNotification.bankName}</p>
                      )}  
                      {order.buyerNotification && order.items && (
                        <p>
                          <b>Total Sum:</b>{" "}
                          {/* {order.items.reduce(
                            (sum, item) =>
                              sum + (item.purchaseType === "rental" ? item.priceLending : item.price),
                            0
                          ) */}
                          {order.items.reduce(
  (sum, item) =>
    sum +
    Number(
      item.finalPrice ??
      (
        item.purchaseType === "rental"
          ? item.priceLending
          : item.price
      )
    ),
  0
)
                          }{" "}
                          ₴
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerOrdersPage;