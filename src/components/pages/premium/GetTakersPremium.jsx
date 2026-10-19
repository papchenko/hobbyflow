import { useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaArrowRight,
  FaShieldAlt,
  FaBolt,
} from "react-icons/fa";

import "./GetTakersPremium.scss";

const GetTakersPremium = () => {
  const navigate = useNavigate();

  const handleBuyPremium = () => {
    navigate("/payment/takers-premium", {
      state: {
        product: {
          id: "premium-taker-30",
          name: "Taker Premium (30 days)",
          price: 99,
          quantity: 1,
        },
      },
    });
  };

  const features = [
    "Ability to create sales posts",
    "Visible in Takers page",
    "Access to Wishlist",
  ];

  return (
    <div className="takers-premium">
      <div className="takers-premium__container">
        <div className="takers-premium__card">

          {/* Card Header */}
          <div className="takers-premium__card-header">
            <div>
              <span>Premium access</span>
              <h2>30 Days</h2>
            </div>

            <div className="takers-premium__popular">
              Premium
            </div>
          </div>

          {/* Price */}
          <div className="takers-premium__price">
            <span>99</span>
            <small>₴</small>
          </div>

          <p className="takers-premium__price-caption">
            One-time payment · 30 days access
          </p>

          {/* Features */}
          <div className="takers-premium__features">
            <div className="takers-premium__features-title">
              <span>What's included</span>
            </div>

            <ul>
              {features.map((feature) => (
                <li key={feature}>
                  <span className="takers-premium__check">
                    <FaCheck />
                  </span>

                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleBuyPremium}
            className="takers-premium__button"
          >
            <span>Get Premium</span>
            <FaArrowRight />
          </button>

          {/* Trust */}
          <div className="takers-premium__trust">
            <div>
              <FaShieldAlt />
              <span>Secure payment</span>
            </div>

            <div>
              <FaBolt />
              <span>Instant access</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GetTakersPremium;