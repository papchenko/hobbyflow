import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaNewspaper,
  FaCalendarAlt,
  FaComments,
} from "react-icons/fa";

import "./ClubNavigation.scss";

const navigationItems = [
  {
    label: "Club",
    path: "/club",
    icon: FaHome,
    end: true,
  },
  {
    label: "News",
    path: "/club/news",
    icon: FaNewspaper,
  },
  {
    label: "Events",
    path: "/club/events",
    icon: FaCalendarAlt,
  },
  {
    label: "Community",
    path: "/club/community",
    icon: FaComments,
  },
];

export default function ClubNavigation() {
  return (
    <nav className="club-navigation" aria-label="HobbyFlow Club navigation">
      <div className="club-navigation__inner">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `club-navigation__item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}