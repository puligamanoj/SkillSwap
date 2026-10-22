import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  CheckCircle2,
  Check,
  Circle,
  Award,
  Target,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const ChatPage = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const navigate = useNavigate();

  // Connection & Peer state
  const [connection, setConnection] = useState(null);
  const [peerUser, setPeerUser] = useState(null);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // Messages & Form state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Refs for auto-scroll & typing timers
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // 1. Validate Connection & Load Message History
  useEffect(() => {
    if (!connectionId) {
      setLoading(false);
      return;
    }

    const initChatData = async () => {
      setLoading(true);
      setError('');
      try {
        // A. Validate connection access
        const connRes = await api.get(`/connections/${connectionId}`);
        const connData = connRes.data.connection;
        setConnection(connData);

        // Identify peer user in connection
        const peer = (connData.users || []).find((u) => u._id !== user?._id) || connData.users[0];
        setPeerUser(peer);

        // B. Load message history
        const msgRes = await api.get(`/messages/${connectionId}`);
        const historyMessages = msgRes.data.messages || [];
        setMessages(historyMessages);

        setTimeout(() => scrollToBottom(false), 100);
      } catch (err) {
        setError(err.message || 'Failed to load connection or messages.');
      } finally {
        setLoading(false);
      }
    };

    initChatData();
  }, [connectionId, user]);

  // 2. Setup Socket.io connection & Real-time Event Listeners
  useEffect(() => {
    if (!connectionId || !token || !peerUser) return;

    // Initialize socket connection
    const socket = initSocket(token);
    socketRef.current = socket;

    if (!socket) return;

    // Join room for this connection
    socket.emit('join_connection', { connectionId }, (res) => {
      if (res && res.status === 'fail') {
        console.warn('Socket room join issue:', res.message);
      }
    });

    // Event: Receive real-time message
    const handleReceiveMessage = (newMessage) => {
      if (newMessage.connection === connectionId || newMessage.connection?._id === connectionId) {
        setMessages((prev) => {
          // Deduplicate message by ID
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });

        setTimeout(() => scrollToBottom(true), 100);

        // Mark as read if from peer
        const senderId = typeof newMessage.sender === 'object' ? newMessage.sender._id : newMessage.sender;
        if (senderId !== user?._id) {
          socket.emit('mark_message_read', { messageId: newMessage._id, connectionId });
          api.patch(`/messages/${newMessage._id}/read`).catch(() => {});
        }
      }
    };

    // Event: Peer typing indicators
    const handleUserTyping = (data) => {
      if (data.connectionId === connectionId && data.userId === peerUser._id) {
        setIsPeerTyping(true);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.connectionId === connectionId && data.userId === peerUser._id) {
        setIsPeerTyping(false);
      }
    };

    // Event: Read Receipts
    const handleMessageRead = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, isRead: true, readAt: data.readAt } : msg
        )
      );
    };

    // Event: Online / Offline status updates
    const handleUserOnline = (data) => {
      if (data.userId === peerUser._id) {
        setIsPeerOnline(true);
      }
    };

    const handleUserOffline = (data) => {
      if (data.userId === peerUser._id) {
        setIsPeerOnline(false);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [connectionId, token, peerUser, user]);

  // 3. Typing event emission with debouncing
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (!socketRef.current || !connectionId) return;

    socketRef.current.emit('typing', { connectionId });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { connectionId });
      }
    }, 1500);
  };

  // 4. Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();

    if (!trimmed) return;

    if (trimmed.length > 2000) {
      setError('Message exceeds maximum 2000 character limit.');
      return;
    }

    setSending(true);
    setError('');

    // Stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { connectionId });
    }

    const socket = socketRef.current;

    // Send via Socket.io with fallback to REST API
    if (socket && socket.connected) {
      socket.emit('send_message', { connectionId, text: trimmed }, async (response) => {
        setSending(false);
        if (response && response.status === 'success') {
          setInputText('');
          scrollToBottom(true);
        } else {
          // Socket callback error fallback to REST
          sendRestMessage(trimmed);
        }
      });
    } else {
      sendRestMessage(trimmed);
    }
  };

  const sendRestMessage = async (text) => {
    try {
      const res = await api.post('/messages', { connectionId, text });
      setSending(false);
      setInputText('');
      if (res.data.data) {
        setMessages((prev) => [...prev, res.data.data]);
        scrollToBottom(true);
      }
    } catch (err) {
      setSending(false);
      setError(err.message || 'Failed to send message.');
    }
  };

  // Missing Connection ID State
  if (!connectionId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '3rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState
            icon={MessageSquare}
            title="Select a Connection to Start Chatting"
            description="Choose an active skill swap partnership from your connections to message peers."
            actionLabel="View Connections"
            onAction={() => navigate('/connections')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const reqInfo = connection?.exchangeRequest || {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
        <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', maxWidth: '1000px' }}>
          {/* Header Bar */}
          <div
            className="glass-card"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: '1rem',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Link to="/connections" className="btn btn-secondary" style={{ padding: '0.45rem', borderRadius: '50%' }} title="Back to Connections">
                <ArrowLeft size={18} />
              </Link>

              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {peerUser?.avatar ? (
                  <img src={peerUser.avatar} alt={peerUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  peerUser?.name ? peerUser.name.charAt(0).toUpperCase() : 'P'
                )}

                {/* Online Status Dot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: isPeerOnline ? 'var(--accent-emerald)' : 'var(--text-subtle)',
                    border: '2px solid var(--bg-surface)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                    {peerUser?.name || 'Chat Partner'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: isPeerOnline ? 'var(--accent-emerald)' : 'var(--text-subtle)', fontWeight: 600 }}>
                    {isPeerOnline ? '• Online' : '• Offline'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {reqInfo.offeredSkill && reqInfo.wantedSkill ? (
                    <span>Exchanging: <strong>{reqInfo.offeredSkill}</strong> ↔ <strong>{reqInfo.wantedSkill}</strong></span>
                  ) : (
                    <span>{peerUser?.institution || 'SkillSwap Member'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />

          {/* Main Chat Box Container */}
          <div
            className="glass-card"
            style={{
              flex: 1,
              minHeight: '450px',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
            }}
          >
            {/* Message History Scroll Container */}
            <div
              style={{
                flex: 1,
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {loading ? (
                <div style={{ margin: 'auto', textAlign: 'center' }}>
                  <LoadingSpinner size={32} label="Loading chat history..." />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                  const isMe = senderId === user?._id;
                  const messageTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <div
                      key={msg._id || index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Message Bubble */}
                      <div
                        style={{
                          padding: '0.75rem 1.1rem',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isMe ? 'var(--primary-600)' : 'var(--bg-surface)',
                          border: isMe ? '1px solid var(--primary-400)' : '1px solid var(--border-light)',
                          color: isMe ? '#ffffff' : 'var(--text-main)',
                          fontSize: '0.95rem',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        {msg.text}
                      </div>

                      {/* Timestamp & Read Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', color: 'var(--text-subtle)', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                        <span>{messageTime}</span>
                        {isMe && (
                          <span>
                            {msg.isRead ? (
                              <CheckCircle2 size={13} color="var(--accent-emerald)" title="Read" />
                            ) : (
                              <Check size={13} color="var(--text-subtle)" title="Sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-subtle)' }}>
                  <MessageSquare size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>No messages yet. Send a greeting to start chatting!</p>
                </div>
              )}

              {/* Peer Typing Indicator */}
              {isPeerTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                  <span>{peerUser?.name || 'Peer'} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                placeholder="Type a message..."
                value={inputText}
                onChange={handleInputChange}
                disabled={sending || loading}
                maxLength={2000}
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !inputText.trim() || loading}
                style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
              >
                {sending ? <LoadingSpinner size={16} label="" /> : <><Send size={16} /> Send</>}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChatPage;
