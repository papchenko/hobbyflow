import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import "./support.scss";

export default function SupportAdmin() {
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setAuthorized(false); setChecking(true);
    if (!user?.uid) { setChecking(false); return; }
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      setAuthorized(snap.exists() && snap.data().role === "admin");
    }).catch(console.error).finally(() => setChecking(false));
  }, [user?.uid]);

  useEffect(() => {
    if (!authorized) return;
    return onSnapshot(query(collection(db, "supportThreads"), orderBy("updatedAt", "desc")),
      (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => { console.error(err); toast.error("Unable to load support requests."); });
  }, [authorized]);

  useEffect(() => {
    if (!authorized || !selected) { setMessages([]); return; }
    return onSnapshot(query(collection(db, "supportThreads", selected, "messages"), orderBy("createdAt", "asc")),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), console.error);
  }, [authorized, selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const selectThread = async (id) => {
    setSelected(id);
    try { await updateDoc(doc(db, "supportThreads", id), { unreadAdmin: false }); }
    catch (err) { console.error(err); }
  };

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!selected || !body || sending || body.length > 2000) return;
    setSending(true);
    try {
      await addDoc(collection(db, "supportThreads", selected, "messages"), {
        senderId: user.uid, senderRole: "admin", text: body, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "supportThreads", selected), {
        lastMessage: body, lastMessageAt: serverTimestamp(), updatedAt: serverTimestamp(), unreadUser: 1, unreadAdmin: false,
      });
      setText("");
    } catch (err) { console.error(err); toast.error("Could not send reply."); }
    finally { setSending(false); }
  };

  const changeStatus = async (status) => {
    if (!selected) return;
    try { await updateDoc(doc(db, "supportThreads", selected), { status, updatedAt: serverTimestamp() }); }
    catch (err) { console.error(err); toast.error("Could not update status."); }
  };

  if (checking) return <div className="bf-support-admin-state">Checking access...</div>;
  if (!authorized) return <div className="bf-support-admin-state">Administrator access required.</div>;
  const active = threads.find((t) => t.id === selected);

  return (
    <main className="bf-support-admin">
      <div className="bf-support-admin-title"><h1>HobbyFlow Support</h1><p>Manage private customer requests and replies.</p></div>
      <div className="bf-support-admin-layout">
        <aside className="bf-support-inbox">
          <h2>Conversations <span>{threads.length}</span></h2>
          {threads.length === 0 && <p className="bf-support-empty">No requests yet.</p>}
          {threads.map((t) => (
            <button key={t.id} type="button" className={`bf-support-thread ${selected === t.id ? "is-selected" : ""}`} onClick={() => selectThread(t.id)}>
              <span className="bf-support-thread-title"><strong>{t.userName || t.userEmail || "Customer"}</strong>{t.unreadAdmin && <i aria-label="Unread" />}</span>
              <small>{t.userEmail}</small><span className="bf-support-thread-preview">{t.lastMessage}</span>
              <em>{t.status === "closed" ? "Closed" : "Open"}</em>
            </button>
          ))}
        </aside>
        <section className="bf-support-admin-conversation">
          {!active ? <p className="bf-support-empty">Select a conversation to view and reply.</p> : <>
            <header className="bf-support-admin-conversation-header">
              <div><strong>{active.userName || "Customer"}</strong><small>{active.userEmail}</small></div>
              <button type="button" onClick={() => changeStatus(active.status === "closed" ? "open" : "closed")}>{active.status === "closed" ? "Reopen" : "Close request"}</button>
            </header>
            <div className="bf-support-messages">
              {messages.map((m) => <div key={m.id} className={`bf-support-message ${m.senderRole === "admin" ? "is-admin" : "is-user"}`}><span>{m.senderRole === "admin" ? "HobbyFlow Support" : "Customer"}</span><p>{m.text}</p></div>)}
              <div ref={bottomRef} />
            </div>
            <form className="bf-support-compose" onSubmit={send}>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply as HobbyFlow Support..." rows={2} maxLength={2000} />
              <button type="submit" disabled={sending || !text.trim()}>Send</button>
            </form>
          </>}
        </section>
      </div>
    </main>
  );
}
