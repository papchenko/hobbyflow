import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import logoImg from '../../../assets/logo.svg';
import authorImg from '../../../assets/author.svg';
import { FaChevronDown, FaGithub } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";

const About = () => {

  const { theme } = useTheme();

  const textColor = theme === 'light' ? 'text-gray-800' : 'text-gray-200';
  const bgColor = theme === 'light' ? 'bg-gray-50' : 'bg-gray-900';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const hoverColor = theme === "light" ? "hover:text-gray-900" : "hover:text-white";


    const socialLinks = [
      { icon: <FaGithub />, url: "https://github.com/papchenko" },
      { icon: <FaLinkedin />, url: "https://www.linkedin.com/in/mykola-papchenko-a424423b5" },
    ];

  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  const versions = [
    "1.0.1 Release",
    "1.1.5 Shop - modal card details implemented",
    "1.2.7 Favorites - the ability to add your favorite books to favorites",
    "1.3.3 Donate - from now on you can donate",
    "1.4.9 Bookflow Reader v 1.0.0",
  ];

  return (
    <div className={`${bgColor} md:py-10 pt-4 pb-10`}>

      {/* Header Section */}
      <section className="py-6 text-center opacity-50">
        <img src={logoImg} alt="BookFlow Logo" className="mx-auto mb-4 w-32 transition dark:invert" />
        <p className={`${textColor} max-w-2xl mx-auto text-lg px-2`}>
          Sale and Lending of Books
        </p>
      </section>

      {/* Author Section */}
      <section className={`py-5 md:py-10 border-t ${borderColor} dark:border-gray`}>
        <div className="container mx-auto px-4 max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Avatar */}
          <div className="w-24 h-24 md:w-24 md:h-24 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden flex-shrink-0">
            <img src={authorImg} alt="Author Name" className="w-full h-full object-cover" />
          </div>

          {/* Author Info */}
          <div className="text-center md:text-left flex-1">
            <h3 className={`text-xl md:text-2xl font-semibold mb-2 ${textColor}`}>Mykola Papchenko</h3>
            <p className={`text-[var(--accept-color)] text-xl md:text-xl text-start`}>
              Front-end developer and creator of the BookFlow project.
            </p>
            <p className='italic pt-2 pb-4 text-sm text-grey-700 dark:text-white text-start opacity-55'>
             &laquo; A full-fledged platform for knowledge exchange. We are constantly working on the project, improving every detail. I hope our platform will bring you a lot of knowledge. Enjoy! &raquo;
            </p>
            <div className="flex gap-4 mt-1 justify-center md:justify-start text-lg">
              {socialLinks.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-3xl md:text-2xl ${textColor} ${hoverColor} transition ml-2`}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Version Section */}
      <section className={`py-0 pt-10 border-t ${borderColor} dark:border-gray`}>
      <div className="container mx-auto px-4 max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-6">
          <p className={`${textColor} px-4 pb-1 text-sm`}>
            Stable version 1.4.9
          </p>
          <p className={`${textColor} px-4 pb-1 text-sm`}>
            Release 149_90
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