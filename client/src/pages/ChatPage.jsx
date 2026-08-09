import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function ChatPage({ api, user, authHeader }) {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketTarget = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
    const instance = io(socketTarget);
    setSocket(instance);
    return () => instance.disconnect();
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      const { data } = await api.get('/chats', { headers: authHeader() });
      setConversations(data.conversations || []);
      if (location.state?.conversationId) {
        const active = (data.conversations || []).find((item) => item._id === location.state.conversationId);
        if (active) setActiveConversation(active);
      }
    };
    loadConversations();
  }, [location.state]);

  useEffect(() => {
    if (!activeConversation || !socket) return;
    socket.emit('join_conversation', activeConversation._id);
    const loadMessages = async () => {
      const { data } = await api.get(`/chats/${activeConversation._id}/messages`, { headers: authHeader() });
      setMessages(data.messages || []);
    };
    loadMessages();

    socket.on('receive_message', (message) => {
      if (message.conversation === activeConversation._id) {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              (m._id && message._id && String(m._id) === String(message._id)) ||
              (m.text === message.text &&
                String(m.sender?._id || m.sender) === String(message.sender?._id || message.sender) &&
                Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 3000)
          );
          if (isDuplicate) return prev;
          return [...prev, message];
        });
      }
    });

    return () => socket.off('receive_message');
  }, [activeConversation, socket]);

  const getOtherParticipant = (conv) => {
    return conv.participants?.find((p) => (p._id || p) !== user._id) || { name: 'User' };
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeConversation) return;
    const textToSend = draft.trim();
    setDraft('');

    try {
      const { data } = await api.post(`/chats/${activeConversation._id}/messages`, { text: textToSend }, { headers: authHeader() });
      const newMsg = data.message || {
        _id: Date.now().toString(),
        conversation: activeConversation._id,
        sender: user._id,
        text: textToSend,
        createdAt: new Date().toISOString()
      };

      socket?.emit('send_message', newMsg);

      setMessages((prev) => {
        const isDuplicate = prev.some((m) => String(m._id) === String(newMsg._id));
        if (isDuplicate) return prev;
        return [...prev, newMsg];
      });

      // Refresh conversations list to update lastMessage
      const convRes = await api.get('/chats', { headers: authHeader() });
      setConversations(convRes.data.conversations || []);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const otherUser = activeConversation ? getOtherParticipant(activeConversation) : null;

  // Filter out any duplicate messages safely by ID or text+sender
  const uniqueMessages = messages.reduce((acc, current) => {
    const currentSenderId = String(current.sender?._id || current.sender);
    const currentId = current._id ? String(current._id) : null;

    const isDuplicate = acc.some((m) => {
      const mSenderId = String(m.sender?._id || m.sender);
      const mId = m._id ? String(m._id) : null;
      if (mId && currentId && mId === currentId) return true;
      if (
        m.text === current.text &&
        mSenderId === currentSenderId &&
        Math.abs(new Date(m.createdAt || Date.now()) - new Date(current.createdAt || Date.now())) < 5000
      ) {
        return true;
      }
      return false;
    });

    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  return (
    <div className="mx-auto grid h-[85vh] max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[340px,1fr]">
      {/* Conversations List Panel */}
      <div className={`rounded-3xl border border-stone-300 bg-white p-4 shadow-sm flex-col ${activeConversation ? 'hidden lg:flex' : 'flex'}`}>
        <p className="mb-4 font-semibold text-lg">Conversations</p>
        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-stone-500 py-4">No active conversations yet.</p>
          ) : (
            conversations.map((conv) => {
              const partner = getOtherParticipant(conv);
              const isActive = activeConversation?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  className={`w-full rounded-2xl p-3 text-left transition border ${isActive ? 'bg-stone-100 border-stone-300' : 'bg-white border-stone-100 hover:bg-stone-50'}`}
                  onClick={() => setActiveConversation(conv)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-charcoal">{partner.name || 'User'}</p>
                    {conv.listing?.price !== undefined && <span className="text-xs text-stone-500">₹{conv.listing.price}</span>}
                  </div>
                  {conv.listing?.title && (
                    <p className="text-xs text-terra-cotta font-medium mt-0.5 truncate">{conv.listing.title}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-500 truncate">{conv.lastMessage || 'Start chatting...'}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Message Thread Panel */}
      <div className={`flex-col rounded-3xl border border-stone-300 bg-white shadow-sm overflow-hidden ${activeConversation ? 'flex' : 'hidden lg:flex'}`}>
        {activeConversation ? (
          <>
            <div className="border-b border-stone-200 p-4 bg-stone-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="lg:hidden rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 transition flex items-center gap-1"
                >
                  <span>←</span> <span>Back</span>
                </button>
                <div>
                  <p className="font-semibold text-charcoal">{otherUser?.name || 'Chat Thread'}</p>
                  {activeConversation.listing?.title && (
                    <p className="text-xs text-stone-500">Item: <span className="font-medium text-stone-700">{activeConversation.listing.title}</span></p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-stone-50/30">
              {uniqueMessages.map((message, index) => {
                const senderId = String(message.sender?._id || message.sender);
                const isMine = senderId === String(user._id);
                return (
                  <div key={message._id || `msg-${index}`} className={`flex flex-col max-w-[70%] ${isMine ? 'ml-auto items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMine ? 'bg-terra-cotta text-white shadow-sm' : 'bg-white border border-stone-200 text-charcoal shadow-sm'}`}>
                      {message.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="flex gap-2 border-t border-stone-200 p-4 bg-white" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <input
                className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/50"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
              />
              <button className="rounded-full bg-charcoal px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition" type="submit">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-stone-500 text-sm">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
