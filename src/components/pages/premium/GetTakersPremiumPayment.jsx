import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import { FaRegCopy } from "react-icons/fa";

const GetTakersPremiumPayment = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [orderNumber] = useState(() => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `PREM-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${random}`;
  });

  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: user?.email || "",
    phone: "+380",
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    bankName: "",
  });

  const [step, setStep] = useState(1);

  if (!product) return <p>No product selected.</p>;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const formatCardNumber = (value) =>
    value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    if (name === "cardNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 16);
      setPaymentData({ ...paymentData, cardNumber: formatCardNumber(digits) });
    } else {
      setPaymentData({ ...paymentData, [name]: value });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    for (let key of ["lastName", "firstName", "email", "phone"]) {
      if (!formData[key]) {
        toast.error("Please fill all required fields");
        return;
      }
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 12) {
      toast.error("Phone number must be 9 digits after +380");
      return;
    }

    setStep(2);
  };

  const handlePaymentSubmit = () => {
    const cardDigits = paymentData.cardNumber.replace(/\D/g, "");
    if (!paymentData.cardNumber || !paymentData.bankName) {
      toast.error("Please fill in card number and bank name");
      return;
    }
    if (cardDigits.length !== 16) {
      toast.error("Card number must be exactly 16 digits");
      return;
    }
    setStep(3);
  };

  const handleFinalConfirm = async () => {
    try {
      await emailjs.send(
        "service_hllb7p1",
        "template_gdn6fcv",
        {
          message: `
            Premium Order
            Order: ${orderNumber}
            Product: ${product.name}
            Price: ${product.price} ₴
            Customer: ${formData.lastName} ${formData.firstName}
            Email: ${formData.email}
            Phone: ${formData.phone}
            Card: ${paymentData.cardNumber}
            Bank: ${paymentData.bankName}
          `,
        },
        "v13Oo-YtABqCO9JLF"
      );

      if (user?.uid) {
        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          orderNumber,
          items: [product],
          total: product.price,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let updateData = {
          cardNumber: paymentData.cardNumber,
          bankName: paymentData.bankName,
        };

        if (userSnap.data()?.sellerStats === undefined) {
          updateData.sellerStats = {
            totalSalesAmount: 0,
            completedOrders: 0,
            ratingAverage: 0,
            ratingCount: 0,
          };
        }

        await updateDoc(userRef, updateData);
      }

      toast.success("Premium order submitted!");
      setStep(4);
    } catch (err) {
      toast.error("Error processing order");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("receipt").innerHTML;
    const newWin = window.open("", "_blank");
    newWin.document.write(`<html><body>${printContent}</body></html>`);
    newWin.document.close();
    newWin.print();
    newWin.close();
  };

  return (
    <div className="py-12 bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] dark:from-[#111018] dark:via-[#1b1a2b] dark:to-[#1c2a3a]">
      <div className="max-w-3xl mx-auto p-6">

        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--secondary-color)]">
          {step === 1 && "Step 1: Your Details"}
          {step === 2 && "Step 2: Enter your payment details for the book sales for which you will receive funds."}
          {step === 3 && "Step 3: Payment Instructions"}
          {step === 4 && "Step 4: Receipt"}
        </h2>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <p className="text-gray-700 dark:text-white">
                * Be sure to enter your account nickname that you registered on the site to activate your premium subscription.
            </p>
            <input name="lastName" placeholder="Last Name" onChange={handleChange} className="p-2 rounded text-gray-900 dark:text-white" required />
            <input name="firstName" placeholder="First Name" onChange={handleChange} className="p-2 rounded text-gray-900 dark:text-white" required />
            <p className="text-gray-700 dark:text-white">
                * Be sure to enter the email address of the account you registered on the site to activate your premium subscription.
            </p>
            <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-2 rounded text-gray-900 dark:text-white" required />
            <input
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                let v = e.target.value;
                if (!v.startsWith("+380")) v = "+380";
                const digits = v.replace(/\D/g, "");
                if (digits.length > 12) return;
                setFormData({ ...formData, phone: v });
              }}
              className="p-2 rounded text-gray-900 dark:text-white"
              required
            />
            <button className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white py-2 rounded">Next</button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <input
              name="bankName"
              placeholder="Bank Name"
              onChange={handlePaymentChange}
              className="p-2 rounded text-gray-900 dark:text-white"
              required
            />
            <input
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={paymentData.cardNumber}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, "");
                if (digits.length > 16) digits = digits.slice(0, 16);
                const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
                setPaymentData({ ...paymentData, cardNumber: formatted });
              }}
              className="p-2 rounded text-gray-900 dark:text-white"
              required
            />
            <button
              onClick={() => {
                const digits = paymentData.cardNumber.replace(/\D/g, "");
                if (!paymentData.bankName || digits.length !== 16) {
                  toast.error("Card number must be exactly 16 digits and bank name filled");
                  return;
                }
                setStep(3);
              }}
              className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color)] text-white py-2 rounded"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white text-black p-6 rounded shadow flex flex-col gap-4">

            <p><b>Order Number:</b> {orderNumber}
              <FaRegCopy className="inline ml-2 cursor-pointer"
                onClick={()=>{navigator.clipboard.writeText(orderNumber);toast.success("Order number copied");}}/>
            </p>
            <p><b>Product:</b> {product.name}</p>
            <p><b>Price:</b> {product.price} ₴</p>

            <div className="bg-gray-100 p-4 rounded text-center">
              <p className="font-bold uppercase text-red-600">MANDATORY FOR PAYMENT!</p>
              <p>In payment description, enter your order number: {orderNumber}</p>
            </div>

            <div className="bg-black text-white p-4 rounded flex justify-between items-center">
              <span style={{letterSpacing:"2px"}}>4790 7299 2893 6954</span>
              <FaRegCopy className="cursor-pointer"
                onClick={()=>{navigator.clipboard.writeText("4790729928936954");toast.success("Card copied");}}/>
            </div>

            <div className="bg-gray-100 p-4 rounded text-center">
              <p className="font-bold">Importantly!</p>
              <p>We received a message about your premium purchase.</p>
              <p className="font-bold text-green-600">
                Pay {product.price} (₴ / UAH) to the card above.
              </p>
              <p>After payment, administrators will activate your premium.</p>
            </div>

            <button onClick={handleFinalConfirm}
              className="bg-green-600 text-white py-3 rounded">
              I paid {product.price} ₴ and added order number in description
            </button>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div id="receipt" className="bg-white text-black p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">Receipt</h3>
            <p><b>Order Number:</b> {orderNumber}</p>
            <p><b>Product:</b> {product.name}</p>
            <p><b>Price:</b> {product.price} ₴</p>
            <p><b>Customer:</b> {formData.lastName} {formData.firstName}</p>
            <p><b>Email:</b> {formData.email}</p>
            <p><b>Phone:</b> {formData.phone}</p>
            <p><b>Card Number:</b> 4790 7299 2893 6954</p>
            <p><b>Bank Name:</b> {paymentData.bankName}</p>

            <div className="flex gap-3 mt-4">
              <button onClick={handlePrint}
                className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color)] text-white px-4 py-2 rounded">
                Print Receipt
              </button>
              <button onClick={()=>navigate("/")}
                className="bg-gray-500 text-white px-4 py-2 rounded">
                Back to Home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GetTakersPremiumPayment;