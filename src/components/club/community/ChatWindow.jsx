import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { FaPaperPlane } from "react-icons/fa";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import MessageItem from "./MessageItem";

export default function ChatWindow({
  channelId,
  channel,
}) {
  const { user, userProfile } = useAuth();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messagesRef = useRef(null);

  useEffect(() => {
    if (!channelId) return;

    const ref = collection(
      db,
      "bookClubChannels",
      channelId,
      "messages",
    );

    const messagesQuery = query(
      ref,
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );
      },
      (error) => {
        console.error(
          "Failed to load chat:",
          error,
        );
      },
    );

    return () => unsubscribe();
  }, [channelId]);

  // useEffect(() => {
  //   messagesRef.current?.scrollIntoView({
  //     behavior: "smooth",
  //   });
  // }, [messages]);

  async function handleSend(e) {
    e.preventDefault();

    const text = message.trim();

    if (!text || !user || sending) {
      return;
    }

    try {
      setSending(true);

      const ref = collection(
        db,
        "bookClubChannels",
        channelId,
        "messages",
      );

      await addDoc(ref, {
  uid: user.uid,

  username:
    userProfile?.name ||
    user.displayName ||
    "User",

  avatar:
    userProfile?.photoURL ||
    user.photoURL ||
    "",

  isPremium:
    userProfile?.taker === true,

  text,

  createdAt: serverTimestamp(),
});

      setMessage("");
    } catch (error) {
      console.error(
        "Failed to send message:",
        error,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-window">

      <header className="chat-window__header">
        <div className="chat-window__channel-icon">
          #
        </div>

        <div>
          <h2>{channel?.name}</h2>

          <p>{channel?.description}</p>
        </div>
      </header>

      <div className="chat-window__messages">

        {messages.length === 0 ? (
          <div className="chat-empty">

            <div className="chat-empty__icon">
              #
            </div>

            <h3>
              Welcome to #{channel?.name}
            </h3>

            <p>
              Be the first to start
              the conversation.
            </p>

          </div>
        ) : (
          messages.map((item) => (
            <MessageItem
              key={item.id}
              message={item}
            />
          ))
        )}

        <div ref={messagesRef} />

      </div>

      <form
        className="chat-window__form"
        onSubmit={handleSend}
      >
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder={
            `Message #${channel?.name}`
          }
          maxLength={1000}
          disabled={!user || sending}
        />

        <button
          type="submit"
          disabled={
            !user ||
            sending ||
            !message.trim()
          }
          aria-label="Send message"
        >
          <FaPaperPlane />
        </button>
      </form>

    </section>
  );
}