import { useState } from "react";

import ClubNavigation from "../navigation/ClubNavigation";
import ChannelList from "./ChannelList";
import ChatWindow from "./ChatWindow";

import "./community.scss";

export const BOOKFLOW_CHANNELS = [
  {
    id: "general",
    name: "General",
    description:
      "General HobbyFlow community discussions",
  },
  {
    id: "books",
    name: "Books",
    description:
      "Talk about books, authors and reading",
  },
  {
    id: "collecting",
    name: "Collecting",
    description:
      "Book collections, editions and collectors",
  },
  {
    id: "trading",
    name: "Trading",
    description:
      "Buying, selling and exchanging books",
  },
  {
    id: "help",
    name: "Help",
    description:
      "Questions and HobbyFlow support",
  },
];

export default function CommunityPage() {
  const [activeChannel, setActiveChannel] =
    useState("general");

  const channel = BOOKFLOW_CHANNELS.find(
    (item) => item.id === activeChannel,
  );

  return (
    <main className="bookflow-community">
      <div className="bookflow-community__container">
        <ClubNavigation />

        {/* <header className="bookflow-community__header">
          <span>BOOKFLOW CLUB</span>

          <h1>Community</h1>

          <p>
            Talk about books, collections,
            trading and everything around reading.
          </p>
        </header> */}

        <div className="community-layout">
          <ChannelList
            channels={BOOKFLOW_CHANNELS}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />

          <ChatWindow
            channelId={activeChannel}
            channel={channel}
          />
        </div>
      </div>
    </main>
  );
}