import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { FaYoutube } from "react-icons/fa";
import { toast } from "react-toastify";
import { supabase } from "../../supabase";
import logoImg from "../../assets/logo.png";
import { color } from "framer-motion";

const Footer = () => {
  const { theme } = useTheme();
  const isDonateOpen = useSelector((state) => state.footer.isDonateOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const textColor =
    theme === "light" ? "text-gray-600" : "text-gray-400";
  const bgColor =
    theme === "light"
      ? "bg-gray-50 border-gray-200"
      : "bg-gray-900 border-gray-800";
  const hoverColor =
    theme === "light" ? "hover:text-gray-900" : "hover:text-white";

  const quickLinks = [
    { label: "Help Center", path: "/help-page" },
    // { label: "Books", path: "/books" },
    // { label: "Takers", path: "/takers" },
    // { label: "About", path: "/about" },
  ];

  const legalLinks = [
    { label: "Terms of Use", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Cookie Policy", path: "/cookies" },
  ];

  const socialLinks = [
    { icon: <FaYoutube />, url: "https://youtube.com" }
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim().toLowerCase();

    const { data: existing, error: checkError } = await supabase
      .from("subscribers")
      .select("email")
      .eq("email", email);

    if (existing?.length > 0) {
      toast.info("You are already subscribed.");
      return;
    }

    const { error } = await supabase
      .from("subscribers")
      .insert([{ email }]);

    if (error) {
      toast.error("Subscription failed.");
      console.error(error);
      return;
    }

    toast.success("Subscribed successfully!");
    e.target.reset();
  };

  return (
    <footer className={`pt-14 pb-8 border-t ${bgColor}`}>
      <div className="container mx-auto px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-10"> */}

          {/* Brand */}
          <div>
            <img src={logoImg} alt="Logo" className="w-[58px] mb-2 dark:invert" />
            <h3 className={`font-semibold text-lg mb-1 ${textColor}`}>
              Sale and Lending Marketplace
            </h3>
            <p className={`${textColor} text-sm leading-relaxed`}>
              All rights reserved. This website and its software are proprietary and protected by applicable copyright, trademark, and intellectual property laws. 
            </p>
            <p className={`${textColor} text-sm leading-relaxed pt-1 hover:text-gray-900 dark:hover:text-white`}><NavLink
                to="/info"
                >
                Info & Updates
              </NavLink></p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className={`font-semibold mb-4 ${textColor}`}>Navigation</h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`${textColor} ${hoverColor} transition`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={`font-semibold mb-4 ${textColor}`}>Legal</h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`${textColor} ${hoverColor} transition`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={`font-semibold mb-4 ${textColor}`}>Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className={textColor}>support@hobbyflow.guru</li>
            </ul>

            {/* <div className="flex gap-4 mt-4 text-lg">
              {socialLinks.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${textColor} ${hoverColor} transition`}
                >
                  {item.icon}
                </a>
              ))}
            </div> */}
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={`font-semibold mb-4 ${textColor}`}>
              Subscribe
            </h4>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
              />

              <button
                type="submit"
                className="bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white px-4 py-2 rounded-md transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className={`mt-12 pt-6 border-t text-center text-sm ${textColor}`}>
          © {new Date().getFullYear()} HobbyFlow
        </div>
      </div>
    </footer>
  );
};

export default Footer;