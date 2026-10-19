import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, orderBy, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "./support.scss";

export default function SupportChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // One private thread per account; admin can view it in SupportAdmin.
  useEffect(() => {
    if (!user?.uid) { setMessages([]); setThread(null); return; }
    const unsubThread = onSnapshot(doc(db, "supportThreads", user.uid),
      (snap) => setThread(snap.exists() ? snap.data() : null),
      (err) => console.error("Support thread:", err));
    const unsubMessages = onSnapshot(
      query(collection(db, "supportThreads", user.uid, "messages"), orderBy("createdAt", "asc")),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Support messages:", err)
    );
    return () => { unsubThread(); unsubMessages(); };
  }, [user?.uid]);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  useEffect(() => {
    if (!open || !user?.uid || !thread?.unreadUser) return;
    updateDoc(doc(db, "supportThreads", user.uid), { unreadUser: 0 }).catch(console.error);
  }, [open, user?.uid, thread?.unreadUser]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!user?.uid || !body || sending || body.length > 2000) return;
    setSending(true);
    try {
      const ref = doc(db, "supportThreads", user.uid);
      await setDoc(ref, {
        userId: user.uid,
        userName: user.displayName || user.name || user.email || "User",
        userEmail: user.email || "",
        status: "open",
        lastMessage: body,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadAdmin: true,
        unreadUser: 0,
      }, { merge: true });
      await addDoc(collection(ref, "messages"), {
        senderId: user.uid, senderRole: "user", text: body, createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) { console.error(err); toast.error("Could not send message. Please try again."); }
    finally { setSending(false); }
  };

  return (
    <div className="bf-support-widget">
      {open && (
        <section className="bf-support-window" role="dialog" aria-label="HobbyFlow support">
          <header className="bf-support-header">
            <div><strong>HobbyFlow Support</strong><small>Private support conversation</small></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close support"><FaTimes /></button>
          </header>
          {!user ? (
            <div className="bf-support-login">
              <FaComments size={28} />
              <h3>Need assistance?</h3>
              <p>Sign in to contact HobbyFlow Support and receive a private reply.</p>
            </div>
          ) : (
            <>
              <div className="bf-support-messages" aria-live="polite">
                {messages.length === 0 && <p className="bf-support-empty">Hello! How can we help you today? Send us your question.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`bf-support-message ${m.senderRole === "admin" ? "is-admin" : "is-user"}`}>
                    <span>{m.senderRole === "admin" ? "HobbyFlow Support" : "You"}</span>
                    <p>{m.text}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className="bf-support-compose" onSubmit={send}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your question..." rows={2} maxLength={2000} aria-label="Support message" />
                <button type="submit" disabled={sending || !text.trim()} aria-label="Send message"><FaPaperPlane /></button>
              </form>
            </>
          )}
        </section>
      )}
      <button className="bf-support-fab" type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close support" : "Open support"} aria-expanded={open}>
        {open ? <FaTimes /> : <FaComments />}
        {!open && Boolean(thread?.unreadUser) && <span className="bf-support-dot" />}
      </button>
    </div>
  );
}
