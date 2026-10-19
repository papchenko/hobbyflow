import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import logoImg from '../../../assets/logo.png';
import authorImg from '../../../assets/author.svg';
// import authorImg from '../../../assets/author.jpg';
import { FaChevronDown, FaGithub } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";

const About = () => {

  const { theme } = useTheme();

  const textColor = theme === 'light' ? 'text-gray-800' : 'text-gray-200';
  const bgColor = theme === 'light' ? 'bg-gray-50' : 'bg-gray-900';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const hoverColor = theme === "light" ? "hover:text-gray-900" : "hover:text-white";

  const authors = [
    {
      id: 1,
      name: "Mykola Papchenko",
      role: "Front-end developer and creator of the HobbyFlow",
      img: authorImg,
      // description:
      //   "",
      quote:
        "HobbyFlow was created to make discovering, sharing, buying, selling, and borrowing books, comics, and board games simple and enjoyable. Every feature is designed to bring enthusiasts together, making it easier to explore new stories, discover exciting games, share collections, and connect with people who share the same passions — all in one modern and convenient platform.",
      socialLinks: [
        { icon: <FaGithub />, url: "https://github.com/papchenko" },
        {
          icon: <FaLinkedin />,
          url: "https://www.linkedin.com/in/mykola-papchenko-a424423b5",
        },
      ],
    },
  ];

  // const socialLinks = [
  //   { icon: <FaGithub />, url: "https://github.com/papchenko" },
  //   { icon: <FaLinkedin />, url: "https://www.linkedin.com/in/mykola-papchenko-a424423b5" },
  // ];

  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  const versions = [
    "1.0.1 Release",
    "1.1.5 Shop - modal card details implemented",
    "1.2.7 Favorites - the ability to add your favorite books to favorites",
    "1.4.9 HobbyFlow Reader v 1.0.0",
    "1.5.5 Now you can bargain with the seller when buying the book.",
    "2.4.1 New system for publishing and displaying books. Added the option to post sales and loans. Includes page count, language, and book condition, as well as post editing.",
    "3.8.0 Implementation of Book Collections.",
    "4.5.7 HobbyFlow Reader v 3.9.0 New functionality, full-screen slide viewing, bug fixes, and a new design.",
    "5.9.0 New color theme technology. It follows the system setting by default, and light and dark themes remain available.",
    "8.0.0 New Taker system: you can now view comprehensive user information, details, and more.",
    "8.0.0 A major redesign of the entire resource.",
    "9.0.0 Implementation Help Center.",
    "10.0.0 Implementation of the HobbyFlow club. News, events, and community interaction.",
    "11.0.0 Implementation of Comics",
    "12.0.0 Implementation of Board Games",
    "13.2.1 New Help Center system with online chat",
    "14.0.0 A brand-new book rental (lending) system",
    "15.0.3 An image enlargement feature has been implemented for books, book collections, comics, and board games.",
  ];

  return (
    <div className={`${bgColor} md:py-10 pt-4 pb-10`}>

      {/* Header Section */}
      <section className="py-6 text-center opacity-50">
        <img src={logoImg} alt="HobbyFlow Logo" className="mx-auto mb-4 w-32 transition dark:invert" />
        <p className={`${textColor} max-w-2xl mx-auto text-lg px-2`}>
          Sale and Lending Marketplace
        </p>
      </section>

      {/* Author Section */}
      <section className={`py-5 md:py-10 border-t ${borderColor}`}>
        <div className="container mx-auto px-4 max-w-4xl">

          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={30}
            loop={true}
            className="about-swiper"
          >
            {authors.map((author) => (
              <SwiperSlide key={author.id}>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

                  {/* {author.img && (
                    <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                      <img
                        src={author.img}
                        alt={author.name || "Author"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )} */}

                  <div className="text-center md:text-left flex-1">

                    {author.description && (
                      <p className={`mt-2 ${textColor} text-start`}>
                        {author.description}
                      </p>
                    )}

                    <p className="italic pt-2 pb-4 text-grey-700 text-xl dark:text-white text-start opacity-55">
                      {author.quote}
                    </p>

                    <div className="flex items-center pb-2">
                      {author.img && (
                    <div className="w-9 mr-3 h-9 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                      <img
                        src={author.img}
                        alt={author.name || "Author"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                    {author.name && (
                      <p className={`text-base md:text-base font-semibold ${textColor}`}>
                        {author.name}
                      </p>
                    )}
                    </div>

                    {author.role && (
                      <p className="text-[var(--accept-color)] text-base text-start pb-7">
                        {author.role}
                      </p>
                    )}

                    {author.socialLinks && (
                      <div className="flex gap-4 mt-1 justify-center md:justify-start">
                        {author.socialLinks.map((item, index) => (
                          <a
                            key={index}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-3xl md:text-2xl ${textColor} ${hoverColor} transition`}
                          >
                            {item.icon}
                          </a>
                        ))}
                      </div>
                    )}

                  </div>

                </div>

              </SwiperSlide>
            ))}
          </Swiper>

        </div>
      </section>

      {/* Version Section */}
      <section className={`py-0 pt-10 border-t ${borderColor} dark:border-gray`}>
      <div className="container mx-auto px-4 max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-6">
          <p className={`${textColor} px-4 pb-1 text-sm`}>
            Stable version 15.0.3
          </p>
          <p className={`${textColor} px-4 pb-1 text-sm`}>
            Release 1850_10
          </p>
        <div className="">
          <div
            className={`${textColor} flex flex-col justify-center items-center gap-2 px-4 py-0 text-sm cursor-pointer select-none`}
            onClick={() => setIsVersionsOpen(!isVersionsOpen)}
          >
            <div className="flex items-center gap-1">
              <span className='text-sm'>More about versions</span>
              <FaChevronDown
                className={`transition-transform duration-300 ${
                  isVersionsOpen ? 'rotate-180' : ''
                }`}
              />
            </div>

            {isVersionsOpen && (
              <div className="mt-1 flex flex-col gap-1">
                {versions.map((v, i) => (
                  <p key={i}>{v}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </section>
    </div>
  );
};

export default About;