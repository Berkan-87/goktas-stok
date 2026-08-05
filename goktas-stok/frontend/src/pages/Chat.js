import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { 
  PaperAirplaneIcon, 
  UserCircleIcon,
  BellIcon,
  BellSlashIcon
} from '@heroicons/react/24/outline';

const Chat = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [chatType, setChatType] = useState('general');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const audioRef = useRef(null);
  const isFirstLoad = useRef(true);

  // ✅ Ses çalma fonksiyonu
  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 300);
    } catch (error) {
      console.log('Ses çalınamadı:', error);
    }
  };

  // ✅ Bildirim göster
  const showNotification = (message) => {
    if (!notificationEnabled) return;
    
    // Tarayıcı bildirimi
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💬 Yeni Mesaj', {
        body: `${message.sender?.name || 'Kullanıcı'}: ${message.content}`,
        icon: '/favicon.ico',
        tag: 'chat-message',
        requireInteraction: true
      });
    }

    // Toast bildirimi
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {message.sender?.name || 'Kullanıcı'}
              </p>
              <p className="text-sm text-gray-500">
                {message.content}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(message.createdAt).toLocaleTimeString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Kapat
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    });
  };

  // ✅ Bildirim izni iste
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ✅ Kullanıcıları ve grupları getir
  useEffect(() => {
    fetchUsersAndGroups();
  }, []);

  const fetchUsersAndGroups = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/groups')
      ]);
      setUsers(usersRes.data.filter(u => u._id !== user._id));
      setGroups(groupsRes.data);
      
      // Aktif sohbetleri oluştur
      const chats = [];
      
      // Genel sohbet
      chats.push({
        id: 'general',
        type: 'general',
        name: 'Genel Sohbet',
        icon: '💬'
      });
      
      // Özel sohbetler
      usersRes.data.filter(u => u._id !== user._id).forEach(u => {
        chats.push({
          id: u._id,
          type: 'private',
          name: u.name,
          icon: '👤'
        });
      });
      
      // Grup sohbetleri
      groupsRes.data.forEach(g => {
        chats.push({
          id: g._id,
          type: 'group',
          name: g.name,
          icon: '👥'
        });
      });
      
      setActiveChats(chats);
    } catch (error) {
      console.error('Veriler alınamadı:', error);
    }
  };

  // ✅ Mesajları getir
  useEffect(() => {
    if (chatType === 'general') {
      fetchGeneralMessages();
    } else if (chatType === 'private' && selectedUser) {
      fetchPrivateMessages(selectedUser);
    } else if (chatType === 'group' && selectedGroup) {
      fetchGroupMessages(selectedGroup);
    }
  }, [chatType, selectedUser, selectedGroup]);

  // ✅ Genel mesajları getir
  const fetchGeneralMessages = async () => {
    try {
      const response = await axios.get('/messages/general');
      const newMessages = response.data;
      
      // Yeni mesaj kontrolü
      if (!isFirstLoad.current && messages.length > 0 && newMessages.length > messages.length) {
        const newMsg = newMessages[newMessages.length - 1];
        if (newMsg.sender?._id !== user._id) {
          showNotification(newMsg);
          playSound();
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      
      // Scroll'u en alta kaydır
      scrollToBottom();
    } catch (error) {
      toast.error('Mesajlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Özel mesajları getir
  const fetchPrivateMessages = async (userId) => {
    try {
      const response = await axios.get(`/messages/private/${userId}`);
      const newMessages = response.data;
      
      // Yeni mesaj kontrolü
      if (!isFirstLoad.current && messages.length > 0 && newMessages.length > messages.length) {
        const newMsg = newMessages[newMessages.length - 1];
        if (newMsg.sender?._id !== user._id) {
          showNotification(newMsg);
          playSound();
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      
      // Mesajları okundu işaretle
      await markAllAsRead('private', userId);
      
      // Scroll'u en alta kaydır
      scrollToBottom();
    } catch (error) {
      toast.error('Mesajlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Grup mesajlarını getir
  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await axios.get(`/messages/group/${groupId}`);
      const newMessages = response.data;
      
      // Yeni mesaj kontrolü
      if (!isFirstLoad.current && messages.length > 0 && newMessages.length > messages.length) {
        const newMsg = newMessages[newMessages.length - 1];
        if (newMsg.sender?._id !== user._id) {
          showNotification(newMsg);
          playSound();
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      
      // Mesajları okundu işaretle
      await markAllAsRead('group', groupId);
      
      // Scroll'u en alta kaydır
      scrollToBottom();
    } catch (error) {
      toast.error('Mesajlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Scroll'u en alta kaydır
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // ✅ Tüm mesajları okundu işaretle
  const markAllAsRead = async (type, id) => {
    try {
      const payload = {};
      if (type === 'private') {
        payload.receiver = id;
      } else if (type === 'group') {
        payload.group = id;
      } else {
        payload.receiver = null;
        payload.group = null;
      }
      
      await axios.put('/messages/mark-all-read', payload);
      
      // UI'da güncelle
      setMessages(prev => prev.map(m => ({
        ...m,
        readBy: [...(m.readBy || []), user._id]
      })));
      
      // Okunmamış sayısını güncelle
      updateUnreadCounts();
    } catch (error) {
      console.error('Okundu işaretleme hatası:', error);
    }
  };

  // ✅ Okunmamış sayılarını güncelle
  const updateUnreadCounts = () => {
    const counts = {};
    activeChats.forEach(chat => {
      if (chat.type === 'general') {
        counts[chat.id] = messages.filter(m => 
          !m.readBy?.includes(user._id) && 
          m.sender?._id !== user._id &&
          !m.receiver && 
          !m.group
        ).length;
      } else if (chat.type === 'private') {
        counts[chat.id] = messages.filter(m => 
          !m.readBy?.includes(user._id) && 
          m.sender?._id !== user._id &&
          (m.sender?._id === chat.id || m.receiver === chat.id)
        ).length;
      } else if (chat.type === 'group') {
        counts[chat.id] = messages.filter(m => 
          !m.readBy?.includes(user._id) && 
          m.sender?._id !== user._id &&
          m.group === chat.id
        ).length;
      }
    });
    setUnreadCounts(counts);
  };

  // ✅ Mesaj gönder
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      let payload = {
        content: newMessage.trim()
      };

      if (chatType === 'general') {
        // Genel sohbet
      } else if (chatType === 'private' && selectedUser) {
        payload.receiver = selectedUser;
      } else if (chatType === 'group' && selectedGroup) {
        payload.group = selectedGroup;
      }

      const response = await axios.post('/messages', payload);
      const newMsg = response.data;
      
      // Mesajı listeye ekle
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Scroll'u en alta kaydır
      scrollToBottom();
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  // ✅ Sohbet değiştir
  const changeChat = (chat) => {
    if (chat.type === 'general') {
      setChatType('general');
      setSelectedUser(null);
      setSelectedGroup(null);
    } else if (chat.type === 'private') {
      setChatType('private');
      setSelectedUser(chat.id);
      setSelectedGroup(null);
    } else if (chat.type === 'group') {
      setChatType('group');
      setSelectedUser(null);
      setSelectedGroup(chat.id);
    }
    setMessages([]);
    isFirstLoad.current = true;
  };

  // ✅ Okunmamış mesaj kontrolü
  const isUnread = (message) => {
    if (!message.readBy) return false;
    return !message.readBy.includes(user._id) && message.sender?._id !== user._id;
  };

  // ✅ Okunmamış mesaj sayısını al
  const getUnreadCount = (chatId) => {
    return unreadCounts[chatId] || 0;
  };

  // ✅ Okunmamış sayılarını güncelle (mesajlar değiştiğinde)
  useEffect(() => {
    updateUnreadCounts();
  }, [messages, activeChats]);

  // ✅ Otomatik yenileme (3 saniye)
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatType === 'general') {
        fetchGeneralMessages();
      } else if (chatType === 'private' && selectedUser) {
        fetchPrivateMessages(selectedUser);
      } else if (chatType === 'group' && selectedGroup) {
        fetchGroupMessages(selectedGroup);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [chatType, selectedUser, selectedGroup]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Mesajlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ✅ Sohbet başlığı
  const getChatTitle = () => {
    if (chatType === 'general') return '💬 Genel Sohbet';
    if (chatType === 'private') {
      const userData = users.find(u => u._id === selectedUser);
      return `👤 ${userData?.name || 'Kullanıcı'}`;
    }
    if (chatType === 'group') {
      const group = groups.find(g => g._id === selectedGroup);
      return `👥 ${group?.name || 'Grup'}`;
    }
    return 'Sohbet';
  };

  // ✅ Toplam okunmamış mesaj sayısı
  const totalUnread = messages.filter(m => isUnread(m)).length;

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-xl shadow-lg overflow-hidden">
      {/* ✅ Sol Sidebar - Sohbet Listesi */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">💬 Sohbetler</h2>
          {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeChats.map((chat) => {
            const unread = getUnreadCount(chat.id);
            return (
              <button
                key={chat.id}
                onClick={() => changeChat(chat)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  (chatType === 'general' && chat.type === 'general') ||
                  (chatType === 'private' && chat.type === 'private' && selectedUser === chat.id) ||
                  (chatType === 'group' && chat.type === 'group' && selectedGroup === chat.id)
                    ? 'bg-blue-50 border-r-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{chat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {chat.name}
                  </span>
                </div>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ✅ Ana Sohbet Alanı */}
      <div className="flex-1 flex flex-col">
        {/* ✅ Başlık */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{getChatTitle()}</h2>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {totalUnread} yeni
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Ses butonu */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}
              title={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
            >
              {soundEnabled ? (
                <BellIcon className="h-5 w-5" />
              ) : (
                <BellSlashIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Bildirim butonu */}
            <button
              onClick={() => setNotificationEnabled(!notificationEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                notificationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}
              title={notificationEnabled ? 'Bildirimleri kapat' : 'Bildirimleri aç'}
            >
              {notificationEnabled ? '🔔' : '🔕'}
            </button>

            {/* Tümünü okundu işaretle */}
            {totalUnread > 0 && (
              <button
                onClick={() => {
                  if (chatType === 'general') {
                    markAllAsRead('general');
                  } else if (chatType === 'private' && selectedUser) {
                    markAllAsRead('private', selectedUser);
                  } else if (chatType === 'group' && selectedGroup) {
                    markAllAsRead('group', selectedGroup);
                  }
                  toast.success('Tüm mesajlar okundu olarak işaretlendi');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>
        </div>

        {/* ✅ Mesaj Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Henüz mesaj yok</p>
              <p className="text-sm text-gray-300 mt-1">İlk mesajı sen gönder!</p>
            </div>
          ) : (
            // ✅ Mesajları göster (EN ALTA EN YENİ)
            messages.map((message) => {
              const isOwn = message.sender?._id === user._id;
              const unread = isUnread(message);
              
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slideIn`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-blue-500 text-white'
                        : unread
                        ? 'bg-gray-800 text-white shadow-lg ring-2 ring-yellow-400' // ✅ OKUNMAMIŞ
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    {/* Gönderen bilgisi */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-80">
                        {isOwn ? 'Ben' : message.sender?.name || 'Kullanıcı'}
                      </span>
                      {unread && (
                        <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                          ● YENİ
                        </span>
                      )}
                    </div>

                    {/* Mesaj içeriği */}
                    <p className="text-sm break-words">{message.content}</p>

                    {/* Zaman */}
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(message.createdAt).toLocaleString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ✅ Mesaj Gönderme */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 input-field"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary px-6 flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {sending ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;