import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const Hero = () => {
  const [progress, setProgress] = useState(0);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePremiumClick = () => {
    if (!user) {
      toast.info("Please sign in to access Premium");
      return;
    }

    navigate("/takers-premium");
  };

  const handleReaderClick = () => {
    if (!user) {
      toast.info("Please sign in to use the reader");
      return;
    }

    navigate("/hobbyflow-reader");
  };

  return (
    <section className="relative w-full overflow-hidden">
      <Swiper
        className="home-swiper w-full h-[70vh] sm:h-screen"
        modules={[Autoplay]}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 20000,
          disableOnInteraction: false,
        }}
        onAutoplayTimeLeft={(swiper, time, percentage) => {
          setProgress(1 - percentage);
        }}>
        {/* SLIDE 1 */}
        <SwiperSlide>
          <div
          // bg-gradient-to-br
          // from-[#e0f2fe]
          // via-[#bae6fd]
          // to-[#7dd3fc]
          // dark:from-[#080b14]
          // dark:via-[#101827]
          // dark:to-[#172b3f]
            className="
              w-full h-full
              flex flex-col justify-center items-center
              text-center text-white
              bg-gradient-to-br
                from-[#e0f2fe]
                via-[#bae6fd]
                to-[#fff]
              dark:bg-[linear-gradient(135deg,#080b14_0%,#111a29_35%,#1b2737_68%,#1f2937_100%)]
            ">
            <div className="px-4 max-w-7xl">
              <h1
                className="
                  text-5xl sm:text-5xl md:text-6xl lg:text-7xl
                  font-bold mb-4
                  text-gray-800 dark:text-white
                ">
                Share Knowledge, Inspire Others
              </h1>

              <p
                className="
                  text-2xl sm:text-xl md:text-2xl lg:text-3xl
                  mb-12 max-w-3xl mx-auto
                  text-gray-800 dark:text-white
                ">
                Here you can sell books, lend them as collateral — instead of
                letting them gather dust on your shelf.
              </p>

              <Link
                to="/books"
                className="
                  bg-[var(--secondary-color)]
                  hover:bg-[var(--secondary-color-hover)]
                  py-4 px-9 sm:px-10
                  rounded-full
                  font-bold
                  transition duration-300
                ">
                Explore Books
              </Link>
            </div>
          </div>
        </SwiperSlide>

        {/* SLIDE 2 PREMIUM */}
        
        <SwiperSlide>
          <div
            className="
              w-full h-full
              flex flex-col justify-center items-center
              text-center
              bg-gradient-to-br
                from-[#e0f2fe]
                via-[#bae6fd]
                to-[#fff]
              dark:bg-[linear-gradient(135deg,#080b14_0%,#111a29_35%,#1b2737_68%,#1f2937_100%)]
            "
          >
            <div className="px-4 max-w-4xl">

              <h2
                className="
                  text-5xl sm:text-5xl md:text-6xl lg:text-7xl
                  font-bold mb-4
                  text-gray-800 dark:text-white
                "
              >
                Want to post? Get Premium!
              </h2>

              <p
                className="
                  text-2xl sm:text-xl md:text-2xl lg:text-3xl
                  mb-12 max-w-3xl mx-auto
                  text-gray-800 dark:text-white
                "
              >
                Activate Premium, gain full control over listings,
                and unlock all platform features.
              </p>

              <button
                onClick={handlePremiumClick}
                className="
                  inline-block
                  bg-[var(--secondary-color)]
                  hover:bg-[var(--secondary-color-hover)]
                  text-white
                  font-bold
                  py-3 px-8
                  rounded-full
                  transition duration-300
                "
              >
                Learn More
              </button>

            </div>
          </div>
        </SwiperSlide>
       

        {/* SLIDE 3 READER */}
        <SwiperSlide>
          <div
            className="
              w-full h-full
              flex flex-col justify-center items-center
              text-center
              bg-gradient-to-br
                from-[#e0f2fe]
                via-[#bae6fd]
                to-[#fff]
              dark:bg-[linear-gradient(135deg,#080b14_0%,#111a29_35%,#1b2737_68%,#1f2937_100%)]
            ">
            <div className="px-4 max-w-4xl">
              <div
                className="
                  flex flex-col items-center
                  gap-1 justify-center
                  text-5xl sm:text-5xl md:text-6xl lg:text-7xl
                  font-bold mb-4
                  text-gray-800 dark:text-white
                ">
                HobbyFlow Reader
              </div>

              <p
                className="
                  text-2xl sm:text-xl md:text-2xl lg:text-3xl
                  mb-12 max-w-3xl mx-auto
                  text-gray-800 dark:text-white
                ">
                Online reader – from our service. Upload, manage, and read
                your books, comics.. with maximum comfort.
              </p>

              <button
                onClick={handleReaderClick}
                className="
                  inline-block
                  bg-[var(--secondary-color)]
                  hover:bg-[var(--secondary-color-hover)]
                  text-white
                  font-bold
                  py-3 px-8
                  rounded-full
                  transition duration-300
                ">
                Start Reading
              </button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* HERO PROGRESS */}
      <div className="hero-progress">
        <div
          className="hero-progress-fill"
          style={{
            transform: `scaleX(${progress})`,
          }}
        />
      </div>
    </section>
  );
};

export default Hero;
