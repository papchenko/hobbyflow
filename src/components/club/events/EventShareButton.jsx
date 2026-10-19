import { useState } from "react";
import { FaShare } from "react-icons/fa";
import { toast } from "react-toastify";

export default function EventShareButton({
  event,
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();

    const url =
      `${window.location.origin}/club/events/${event.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text:
            event.subtitle ||
            "HobbyFlow community event",
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);

      setCopied(true);

      toast.success("Event link copied!");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error(
        "Failed to share event:",
        error,
      );
    }
  }

  return (
    <button
      type="button"
      className="event-share"
      onClick={handleShare}
    >
      <FaShare />

      <span>
        {copied ? "Copied" : "Share"}
      </span>
    </button>
  );
}