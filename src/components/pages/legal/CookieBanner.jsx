import { useEffect, useState } from "react"
import logoImg from '../../../assets/logo.png'

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const rejectNonEssential = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <img src={logoImg} alt="Image" className="logo-img transition invert w-14" />
        <p className="text-sm">
          We use cookies to improve your experience. By clicking "Accept",
          you consent to our use of cookies.
        </p>

        <div className="flex gap-3">
          <button
            onClick={rejectNonEssential}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Reject
          </button>

          <button
            onClick={acceptAll}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;