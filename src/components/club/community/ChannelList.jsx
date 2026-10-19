import {
  FaBook,
  FaComments,
  FaExchangeAlt,
  FaQuestionCircle,
  FaLayerGroup,
} from "react-icons/fa";

const icons = {
  general: FaComments,
  books: FaBook,
  collecting: FaLayerGroup,
  trading: FaExchangeAlt,
  help: FaQuestionCircle,
};

export default function ChannelList({
  channels,
  activeChannel,
  onChannelChange,
}) {
  return (
    <aside className="channel-list">

      <div className="channel-list__header">
        CHANNELS
      </div>

      <div className="channel-list__items">

        {channels.map((channel) => {
          const Icon =
            icons[channel.id] || FaComments;

          return (
            <button
              key={channel.id}
              type="button"
              className={`channel-item ${
                activeChannel === channel.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onChannelChange(channel.id)
              }
            >
              <span className="channel-item__icon">
                <Icon />
              </span>

              <span className="channel-item__name">
                {channel.name}
              </span>
            </button>
          );
        })}

      </div>
    </aside>
  );
}