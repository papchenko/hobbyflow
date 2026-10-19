// import { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import LoginForm from "./LoginForm";
// import RegisterForm from "./RegisterForm";
// import { FaTimes } from "react-icons/fa";

// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { auth, db } from "../../firebase";
// import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// const AuthModal = ({ onClose }) => {
//   const [mode, setMode] = useState("login");

//   useEffect(() => {
//     document.body.style.overflow = "hidden";
//     return () => (document.body.style.overflow = "auto");
//   }, []);

//   return createPortal(
//     <div
//       className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//         >
//           <FaTimes className="w-5 h-5" />
//         </button>

//         <div className="px-8 py-16">
//           {mode === "login" ? (
//             <>
//               <LoginForm onSuccess={onClose} />
//               <p className="text-sm text-center mt-6 text-gray-500">
//                 Don’t have an account?
//                 <button
//                   onClick={() => setMode("register")}
//                   className="ml-2 font-medium text-[var(--secondary-color)] hover:underline"
//                 >
//                   Register
//                 </button>
//               </p>
//             </>
//           ) : (
//             <>
//               <RegisterForm onSuccess={onClose} />
//               <p className="text-sm text-center mt-6 text-gray-500">
//                 Already have an account?
//                 <button
//                   onClick={() => setMode("login")}
//                   className="ml-2 font-medium text-[var(--secondary-color)] hover:underline"
//                 >
//                   Login
//                 </button>
//               </p>
//             </>
//           )}
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// };

// export default AuthModal;
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { FaTimes } from "react-icons/fa";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import "./AuthModal.scss";

const AuthModal = ({ onClose }) => {
  const [mode, setMode] = useState("login");

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => (document.body.style.overflow = "auto");
  }, []);

  return createPortal(
    <div
      className="auth-modal"
      onClick={onClose}
    >
      <div
        className="auth-modal__dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="auth-modal__close"
          aria-label="Close authentication modal"
        >
          <FaTimes />
        </button>

        {/* Decorative accent */}
        {/* <div className="auth-modal__accent" /> */}

        {/* Content */}
        <div className="auth-modal__content">
          {mode === "login" ? (
            <>
              <LoginForm onSuccess={onClose} />

              <p className="auth-modal__switch">
                <span>Don’t have an account?</span>

                <button
                  onClick={() => setMode("register")}
                  className="auth-modal__switch-button"
                >
                  Register
                </button>
              </p>
            </>
          ) : (
            <>
              <RegisterForm onSuccess={onClose} />

              <p className="auth-modal__switch">
                <span>Already have an account?</span>

                <button
                  onClick={() => setMode("login")}
                  className="auth-modal__switch-button"
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AuthModal;