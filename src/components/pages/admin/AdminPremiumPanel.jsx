import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowRight,
  FaHeadset,
  FaClock,
  FaCheckCircle,
  FaInfo,
} from "react-icons/fa";

const AdminPremiumPanel = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));

        const pending = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (order) =>
              order.status === "pending" &&
              !!order.userId
          );

        setOrders(pending);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAdmin]);

  const handleActivatePremium = async (order) => {
    if (processingId) return;

    setProcessingId(order.id);

    try {
      const userRef = doc(db, "users", order.userId);
      const orderRef = doc(db, "orders", order.id);

      await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        const userSnap = await transaction.get(userRef);

        if (!orderSnap.exists() || !userSnap.exists()) {
          throw new Error("Order or user not found");
        }

        if (orderSnap.data().status !== "pending") {
          throw new Error("Order already processed");
        }

        const userData = userSnap.data();
        const now = new Date();

        let baseDate = now;

        if (userData.premiumUntil?.toDate) {
          const current = userData.premiumUntil.toDate();

          if (current > now) {
            baseDate = current;
          }
        }

        const newPremium = new Date(
          baseDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        transaction.update(userRef, {
          taker: true,
          premiumUntil: Timestamp.fromDate(newPremium),
        });

        transaction.update(orderRef, {
          status: "completed",
        });
      });

      setOrders((prev) =>
        prev.filter((item) => item.id !== order.id)
      );

      toast.success("Premium activated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Activation failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[var(--text-color)]">
        <h2 className="text-xl font-semibold">
          Access denied
        </h2>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-[var(--text-color)]">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--secondary-color)] font-semibold mb-3">
          HobbyFlow Administration
        </p>

        {/* <h1 className="text-3xl md:text-4xl font-bold">
          Admin Panel
        </h1> */}

        <p className="text-sm opacity-60 mt-3">
          Manage premium subscriptions and customer support.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between mb-6">
            <FaInfo className="text-2xl text-[var(--secondary-color)]" />
            <FaClock className="opacity-40" />
          </div>

          <p className="text-sm opacity-60">
            Pending Premium Orders
          </p>

          <p className="text-4xl font-bold mt-2">
            {orders.length}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/support")}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-left transition-all hover:border-[var(--secondary-color)] group"
        >
          <div className="flex items-center justify-between mb-6">
            <FaHeadset className="text-2xl text-[var(--secondary-color)]" />
            <FaArrowRight className="opacity-50 group-hover:translate-x-1 transition-transform" />
          </div>

          <p className="text-sm opacity-60">
            Customer Support
          </p>

          <p className="text-xl font-bold mt-2">
            Open Messages
          </p>
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold">
          Premium Requests
        </h2>
      </div>

      {loading ? (
        <p className="opacity-60 py-10">
          Loading orders...
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-10 text-center">
          <FaCheckCircle className="text-3xl text-[var(--secondary-color)] mx-auto mb-4" />
          <p className="font-semibold">
            No pending Premium requests
          </p>
          <p className="text-sm opacity-60 mt-2">
            All premium requests have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="font-semibold">
                  Premium Request
                </h3>

                <span className="text-xs rounded-full px-3 py-1 bg-amber-500/10 text-amber-500">
                  Pending
                </span>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div>
                  <p className="opacity-50 mb-1">User ID</p>
                  <p className="break-all">{order.userId}</p>
                </div>

                <div>
                  <p className="opacity-50 mb-1">
                    Order Number
                  </p>
                  <p>{order.orderNumber || order.id}</p>
                </div>

                <div>
                  <p className="opacity-50 mb-1">Total</p>
                  <p className="font-bold text-lg">
                    {order.total ?? "—"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => handleActivatePremium(order)}
                className="w-full rounded-xl bg-[var(--secondary-color)] text-white font-semibold py-3 px-4 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {processingId === order.id
                  ? "Activating..."
                  : "Activate Premium"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default AdminPremiumPanel;