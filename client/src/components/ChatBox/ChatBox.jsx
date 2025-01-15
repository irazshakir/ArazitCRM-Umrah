import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, Tooltip, Tabs, Select, Alert, Avatar } from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  PaperClipOutlined,
  StrikethroughOutlined,
  ItalicOutlined,
  BoldOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  UserOutlined
} from '@ant-design/icons';
import styles from './ChatBox.module.css';
import theme from '../../theme';
import axios from 'axios';
import io from 'socket.io-client';
import { BACKEND_URL } from '../../constants/config';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

// Define inline styles separately from CSS modules
const inlineStyles = {
  assignmentSection: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fffbe6'  // Light yellow background
  },
  assignmentAlert: {
    marginBottom: 0,
    border: 'none',
    backgroundColor: 'transparent',
    padding: 0
  }
};

// Helper function to safely convert PostgreSQL timestamp to Unix timestamp
const postgresTimestampToUnix = (pgTimestamp) => {
  try {
    // Handle PostgreSQL timestamp with timezone format
    // Example: 2025-01-14 20:58:04.102689+00
    return Math.floor(new Date(pgTimestamp).getTime() / 1000);
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return Math.floor(Date.now() / 1000); // Fallback to current time
  }
};

const ChatBox = ({ 
  onSendMessage, 
  onAddNote, 
  placeholder = "Type a message...",
  currentAssignee = null,
  onAssigneeChange,
  id,
  phone
}) => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('reply');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  // Fetch active users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/users?active=true');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Add this new effect to fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        if (id) {
          const response = await axios.get(`/api/leads/${id}/notes`);
          if (response.data) {
            const formattedNotes = response.data.map(note => ({
              ...note,
              // Use the helper function for timestamp conversion
              timestamp: postgresTimestampToUnix(note.created_at)
            }));
            setNotes(formattedNotes);
          }
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        message.error('Failed to fetch notes');
      }
    };

    if (id) {
      fetchNotes();
    }
  }, [id]);

  // Get assigned user name
  const getAssignedUserName = () => {
    if (!currentAssignee) return 'Admin';
    const assignedUser = users.find(user => user.id === currentAssignee);
    return assignedUser?.name || 'Admin';
  };

  const handleSend = async () => {
    if (message.trim()) {
      try {
        if (activeTab === 'reply') {
          const response = await axios.post(`${BACKEND_URL}/api/webhook/reply`, {
            recipient: phone,
            text: message,
            leadId: id
          });

          if (response.data.success) {
            const serverTimestamp = response.data.timestamp || (Date.now() / 1000);
            setMessages(prev => [...prev, {
              id: response.data.messageId || Date.now(),
              message: message,
              timestamp: serverTimestamp,
              is_outgoing: true,
              phone: phone
            }]);
            
            setMessage('');
          } else {
            console.error('Failed to send message:', response.data.error);
          }
        } else {
          // For notes, let the server handle the timestamp
          const noteResponse = await onAddNote(message);
          const response = await axios.get(`/api/leads/${id}/notes`);
          
          // Format the fetched notes with proper timestamp conversion
          const formattedNotes = response.data.map(note => ({
            ...note,
            // Always convert PostgreSQL timestamp to Unix timestamp
            timestamp: new Date(note.created_at).getTime() / 1000
          }));
          
          setNotes(formattedNotes);
          setMessage('');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add user assignment handler
  const handleAssignUser = async (userId) => {
    try {
      await axios.patch(`/api/leads/assign/${id}`, {
        assigned_user: userId
      });
      onAssigneeChange(userId);
      message.success('Lead assigned successfully');
    } catch (error) {
      message.error('Failed to assign lead');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('new_whatsapp_message', (messageData) => {
      console.log('ChatBox received message:', messageData);
      const timestamp = messageData.timestamp 
        ? new Date(messageData.timestamp * 1000).getTime() / 1000  // Convert to Unix timestamp
        : Math.floor(Date.now() / 1000);

      setMessages(prev => [...prev, {
        id: messageData.id || Date.now(),
        message: messageData.text?.body || messageData.message,
        timestamp: timestamp,
        is_outgoing: false,
        phone: messageData.from
      }]);
    });

    return () => newSocket.close();
  }, []);

  // Fetch existing messages when chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (id) {
        try {
          const response = await axios.get(`/api/webhook/messages/${id}`);
          if (response.data.success) {
            const formattedMessages = response.data.data.map(msg => ({
              id: msg.id,
              message: msg.message,
              timestamp: new Date(msg.timestamp).getTime() / 1000, // Convert all dates to Unix timestamp
              is_outgoing: msg.is_outgoing,
              phone: msg.phone
            }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
  }, [id]);

  const renderMessages = () => {
    const combinedMessages = [
      ...messages.map(msg => ({
        ...msg,
        type: 'whatsapp',
        timestamp: typeof msg.timestamp === 'string' 
          ? postgresTimestampToUnix(msg.timestamp)
          : msg.timestamp
      })),
      ...notes.map(note => ({
        id: note.id,
        message: note.note || '',
        // Properly convert PostgreSQL timestamp
        timestamp: postgresTimestampToUnix(note.created_at),
        type: 'note',
        user: note.users?.name || 'Unknown'
      }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {combinedMessages.map((item, index) => {
          // Format the time display
          const messageTime = new Date(item.timestamp * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });

          if (item.type === 'whatsapp') {
            return (
              <div 
                key={item.id || index}
                className={`${styles.messageContainer} ${item.is_outgoing ? styles.sentMessage : styles.receivedMessage}`}
              >
                <div className={styles.messageBubble}>
                  <div className={styles.messageText}>
                    {item.message}
                  </div>
                  <div className={styles.messageFooter}>
                    <span className={styles.messageTime}>
                      {messageTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div 
                key={item.id || index}
                className={`${styles.messageContainer} ${styles.noteMessage}`}
              >
                <div className={`${styles.messageBubble} ${styles.noteBubble}`}>
                  <div className={styles.noteHeader}>
                    <small>Note by {item.user}</small>
                  </div>
                  <div className={`${styles.messageText} ${styles.noteText}`}>
                    {item.message}
                  </div>
                  <div className={styles.messageFooter}>
                    <span className={styles.messageTime}>
                      {messageTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Add auto-scroll to bottom for new messages
  useEffect(() => {
    const messagesContainer = document.querySelector(`.${styles.messagesContainer}`);
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatBoxContainer}>
      <div className={styles.messagesContainer}>
        {renderMessages()}
      </div>

      {/* Assignment Alert */}
      <div style={inlineStyles.assignmentSection}>
        <Alert
          message={`This conversation is assigned to ${getAssignedUserName()}`}
          type="warning"
          showIcon
          style={inlineStyles.assignmentAlert}
        />
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        {/* Formatting Tools */}
        <div className={styles.formattingTools}>
          <Tooltip title="Bold">
            <Button type="text" icon={<BoldOutlined />} />
          </Tooltip>
          <Tooltip title="Italic">
            <Button type="text" icon={<ItalicOutlined />} />
          </Tooltip>
          <Tooltip title="Strikethrough">
            <Button type="text" icon={<StrikethroughOutlined />} />
          </Tooltip>
          <Tooltip title="Bullet List">
            <Button type="text" icon={<UnorderedListOutlined />} />
          </Tooltip>
          <Tooltip title="Numbered List">
            <Button type="text" icon={<OrderedListOutlined />} />
          </Tooltip>
          <Tooltip title="Align">
            <Button type="text" icon={<AlignLeftOutlined />} />
          </Tooltip>
        </div>

        {/* Message Input with Tabs */}
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          className={styles.tabs}
        >
          <TabPane tab="Reply" key="reply">
            <div className={styles.messageInput}>
              <Button 
                type="text" 
                icon={<SmileOutlined />}
                className={styles.iconButton}
              />
              <Button 
                type="text" 
                icon={<PaperClipOutlined />}
                className={styles.iconButton}
              />
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                autoSize={{ minRows: 1, maxRows: 4 }}
                className={styles.textarea}
              />
              <Button 
                type="text"
                icon={<SendOutlined />} 
                onClick={handleSend}
                className={styles.iconButton}
              />
            </div>
          </TabPane>
          <TabPane tab="Notes" key="notes">
            <div className={`${styles.messageInput} ${styles.notesInput}`}>
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add an internal note..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                className={styles.textarea}
              />
              <Button 
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                className={styles.sendButton}
                style={{ backgroundColor: theme.colors.primary }}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatBox;
