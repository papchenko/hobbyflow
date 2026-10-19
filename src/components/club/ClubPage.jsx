import { Link } from "react-router-dom";
import {
  FaNewspaper,
  FaCalendarAlt,
  FaComments,
  FaArrowRight,
  FaBookOpen,
} from "react-icons/fa";

import ClubNavigation from "./navigation/ClubNavigation";

import "./ClubPage.scss";

const clubSections = [
  {
    title: "News",
    description:
      "HobbyFlow updates, book news, collecting tips and interesting stories.",
    path: "/club/news",
    icon: FaNewspaper,
  },
  {
    title: "Events",
    description:
      "Community events, book meetings, challenges and special occasions.",
    path: "/club/events",
    icon: FaCalendarAlt,
  },
  {
    title: "Community",
    description:
      "Talk with other readers, collectors and book lovers.",
    path: "/club/community",
    icon: FaComments,
  },
];

export default function ClubPage() {
  return (
    <main className="bookflow-club">
      <div className="bookflow-club__container">
        <ClubNavigation />

        <section className="bookflow-club__sections">
          {clubSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.title}
                to={section.path}
                className="bookflow-club__card"
              >
                <div className="bookflow-club__card-glow" />

                <div className="bookflow-club__card-top">
                  <div className="bookflow-club__card-icon">
                    <Icon />
                  </div>

                  <span className="bookflow-club__card-arrow">
                    <FaArrowRight />
                  </span>
                </div>

                <div className="bookflow-club__card-content">
                  <span className="bookflow-club__card-label">
                    HobbyFlow CLUB
                  </span>

                  <h2>{section.title}</h2>

                  <p>{section.description}</p>
                </div>

                <div className="bookflow-club__card-footer">
                  <span>Explore section</span>
                  <FaArrowRight />
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}