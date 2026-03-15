import React, { useState } from 'react';
import { Search, Send, User, MoreVertical, Link2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Messages.css';


const Messages = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchChats = async () => {
    if (!currentUser.id) return;
    try {
      const conns = await fetch(`http://localhost:5000/api/connections/${currentUser.id}`).then(r => r.json());
      if (Array.isArray(conns)) {
        setChats(conns);
        if (conns.length > 0 && !activeChat) {
          setActiveChat(conns[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser.id) return;
    try {
      const allMsgs = await fetch(`http://localhost:5000/api/messages/${currentUser.id}`).then(r => r.json());
      if (Array.isArray(allMsgs)) {
        setMessages(allMsgs);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  React.useEffect(() => {
    fetchChats();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !activeChat) return;

    try {
      await fetch(`http://localhost:5000/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          receiver_id: activeChat.sender_id === currentUser.id ? activeChat.receiver_id : activeChat.sender_id,
          content: msg
        })
      });
      setMsg('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredMessages = messages.filter(m => 
    activeChat && (
      (m.sender_id === activeChat.sender_id || m.sender_id === activeChat.receiver_id) &&
      (m.receiver_id === activeChat.sender_id || m.receiver_id === activeChat.receiver_id)
    )
  ).sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  if (loading) return <div className="loading">Loading messages...</div>;
  if (chats.length === 0) return (
    <div className="messages-page empty">
      <Card>
        <div className="empty-state">
          <Link2 size={48} />
          <h3>No connections yet</h3>
          <p>Connect with people in the Network to start messaging.</p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="messages-page">
      <div className="messages-layout-v2">
        {/* Sidebar */}
        <aside className="msg-sidebar">
          <div className="sidebar-header">
            <h3>Messages</h3>
          </div>
          <div className="conv-list">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                className={`conv-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="avatar-small">{chat.full_name?.charAt(0)}</div>
                <div className="conv-preview">
                  <div className="conv-header">
                    <span className="conv-name">{chat.full_name}</span>
                  </div>
                  <p className="last-msg-text">{chat.role}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Panel */}
        <main className="chat-panel-v2">
          {activeChat && (
            <>
              <header className="chat-header-v2">
                <h2>{activeChat.full_name}</h2>
                <Button variant="ghost" size="sm" icon={MoreVertical}></Button>
              </header>

              <div className="chat-content-v2">
                {filteredMessages.map(m => (
                  <div key={m.id} className={m.sender_id === currentUser.id ? 'bubble-sent' : 'bubble-received'}>
                    <div className="bubble">
                      {m.content}
                    </div>
                    <span className="bubble-time">
                      {m.sent_at ? (
                        new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : 'Just now'}
                    </span>
                  </div>
                ))}
              </div>

              <footer className="chat-footer-v2">
                <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  />
                  <Button type="submit" variant="primary" className="btn-send-v2">Send</Button>
                </form>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messages;
