import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { 
  PaperAirplaneIcon, 
  UserCircleIcon,
  BellIcon,
  BellSlashIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isFirstLoad = useRef(true);

  // ✅ Ses çalma
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

  // ✅ Kullanıcıları ve grupları getir - HER 10 SANİYEDE BİR YENİLE
  useEffect(() => {
    fetchUsersAndGroups();
    const interval = setInterval(() => {
      fetchUsersAndGroups();
    }, 10000); // ✅ 10 saniyede bir yenile
    return () => clearInterval(interval);
  }, []);

  const fetchUsersAndGroups = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/groups')
      ]);
      
      const filteredUsers = usersRes.data.filter(u => u._id !== user._id);
      
      // ✅ Kullanıcı listesi değişti mi kontrol et
      const currentUserIds = users.map(u => u._id).sort().join(',');
      const newUserIds = filteredUsers.map(u => u._id).sort().join(',');
      
      if (currentUserIds !== newUserIds) {
        console.log('📱 Kullanıcı listesi güncellendi:', filteredUsers.length);
        toast.success('📱 Kullanıcı listesi güncellendi', { icon: '🔄' });
      }
      
      setUsers(filteredUsers);
      setGroups(groupsRes.data);
      
      const chats = [];
      chats.push({
        id: 'general',
        type: 'general',
        name: 'Genel Sohbet',
        icon: '💬'
      });
      
      filteredUsers.forEach(u => {
        chats.push({
          id: u._id,
          type: 'private',
          name: u.name || u.username || 'İsimsiz Kullanıcı',
          icon: '👤',
          role: u.role || 'Kullanıcı'
        });
      });
      
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
      console.error('❌ Veriler alınamadı:', error);
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
      
      // ✅ YENİ MESAJ KONTROLÜ - Herkese bildirim gitmeli
      if (!isFirstLoad.current && messages.length > 0 && newMessages.length > messages.length) {
        const newMsg = newMessages[newMessages.length - 1];
        if (newMsg.sender?._id !== user._id) {
          // ✅ BİLDİRİM GÖNDER
          showNotification(newMsg);
          playSound();
          
          // ✅ Eğer genel sohbetteysen otomatik okuma
          if (chatType === 'general') {
            await markAllAsRead('general');
          }
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      scrollToBottom();
    } catch (error) {
      console.error('Mesajlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Özel mesajları getir
  const fetchPrivateMessages = async (userId) => {
    try {
      const response = await axios.get(`/messages/private/${userId}`);
      const newMessages = response.data;
      
      if (!isFirstLoad.current && messages.length > 0 && newMessages.length > messages.length) {
        const newMsg = newMessages[newMessages.length - 1];
        if (newMsg.sender?._id !== user._id) {
          showNotification(newMsg);
          playSound();
          // ✅ Özel sohbette otomatik okuma
          await markAllAsRead('private', userId);
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      scrollToBottom();
    } catch (error) {
      console.error('Mesajlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Grup mesajlarını getir
  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await axios.get(`/messages/group/${groupId}`);
      const newMessages = response.data;
      
      if (!isFirstLoad.current && messages.length > 0 && newMessages.length > messages.length) {
        const newMsg = newMessages[newMessages.length - 1];
        if (newMsg.sender?._id !== user._id) {
          showNotification(newMsg);
          playSound();
          await markAllAsRead('group', groupId);
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      scrollToBottom();
    } catch (error) {
      console.error('Mesajlar alınamadı:', error);
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
    if (isMarkingRead) return;
    setIsMarkingRead(true);
    
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
      
      setMessages(prev => prev.map(m => {
        if (!m.readBy?.includes(user._id) && m.sender?._id !== user._id) {
          return {
            ...m,
            readBy: [...(m.readBy || []), user._id]
          };
        }
        return m;
      }));
      
      updateUnreadCounts();
    } catch (error) {
      console.error('Okundu işaretleme hatası:', error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  // ✅ Tek bir mesajı okundu işaretle
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`/messages/read/${messageId}`);
      
      setMessages(prev => prev.map(m => {
        if (m._id === messageId && !m.readBy?.includes(user._id)) {
          return {
            ...m,
            readBy: [...(m.readBy || []), user._id]
          };
        }
        return m;
      }));
      
      updateUnreadCounts();
    } catch (error) {
      console.error('Mesaj okuma hatası:', error);
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
      
      newMsg.readBy = [user._id];
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
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
    setSidebarOpen(false);
  };

  // ✅ Okunmamış mesaj kontrolü
  const isUnread = (message) => {
    if (!message.readBy) return true;
    return !message.readBy.includes(user._id) && message.sender?._id !== user._id;
  };

  // ✅ Okunmamış mesaj sayısını al
  const getUnreadCount = (chatId) => {
    return unreadCounts[chatId] || 0;
  };

  // ✅ Okunmamış sayılarını güncelle
  useEffect(() => {
    updateUnreadCounts();
  }, [messages, activeChats]);

  // ✅ Otomatik yenileme - 3 saniye
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

  // ✅ Arama filtresi
  const filteredChats = activeChats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Mesaja tıklandığında okundu işaretle
  const handleMessageClick = (message) => {
    if (isUnread(message)) {
      markMessageAsRead(message._id);
    }
  };

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
      return `👤 ${userData?.name || userData?.username || 'Kullanıcı'}`;
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
    <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50 rounded-xl shadow-lg overflow-hidden">
      
      {/* Mobil Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 truncate">{getChatTitle()}</h2>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`
            lg:relative lg:w-72 lg:flex lg:flex-col
            fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">💬 Sohbetler</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="hidden lg:block p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">💬 Sohbetler</h2>
                <button
                  onClick={() => {
                    fetchUsersAndGroups();
                    toast.success('📱 Kullanıcı listesi yenilendi');
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Listeyi yenile"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activeChats.length - 1} kişiyle sohbet edebilirsin
              </p>
            </div>

            {/* Arama */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sohbet listesi */}
            {filteredChats.map((chat) => {
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
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">{chat.icon}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-700 truncate block">
                        {chat.name}
                        {unread > 0 && (
                          <span className="ml-2 text-xs text-red-500 font-bold">●</span>
                        )}
                      </span>
                      {chat.role && chat.type === 'private' && (
                        <span className="text-xs text-gray-400 truncate block">
                          {chat.role}
                        </span>
                      )}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                👥 {users.length} kullanıcı ile sohbet edebilirsin
              </p>
            </div>
          </div>
        </div>

        {/* Mobil overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Ana Sohbet Alanı */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {/* Desktop Başlık */}
          <div className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{getChatTitle()}</h2>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                  {totalUnread} yeni
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {soundEnabled ? (
                  <BellIcon className="h-5 w-5" />
                ) : (
                  <BellSlashIcon className="h-5 w-5" />
                )}
              </button>
              
              <button
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  notificationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {notificationEnabled ? '🔔' : '🔕'}
              </button>

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
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>
          </div>

          {/* ✅ Mesaj Listesi - YANIP SÖNME YOK */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Henüz mesaj yok</p>
                <p className="text-sm text-gray-300 mt-1">İlk mesajı sen gönder!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender?._id === user._id;
                const unread = isUnread(message);
                
                return (
                  <div
                    key={message._id}
                    onClick={() => handleMessageClick(message)}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} cursor-pointer`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 transition-all ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : unread
                          ? 'bg-gray-800 text-white shadow-lg ring-2 ring-yellow-400' // ✅ KOYU RENK - YANIP SÖNME YOK
                          : 'bg-white text-gray-900 border border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium opacity-80">
                          {isOwn ? 'Ben' : message.sender?.name || 'Kullanıcı'}
                        </span>
                        {unread && (
                          <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold">
                            YENİ
                          </span>
                        )}
                        {!unread && !isOwn && (
                          <span className="text-xs text-gray-400">
                            ✓✓ Okundu
                          </span>
                        )}
                      </div>

                      <p className="text-sm break-words">{message.content}</p>

                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : unread ? 'text-gray-300' : 'text-gray-400'}`}>
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

          {/* Mesaj Gönderme */}
          <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-1 input-field text-sm sm:text-base"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="btn-primary px-4 sm:px-6 py-2 flex items-center gap-2 text-sm sm:text-base"
              >
                <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{sending ? 'Gönderiliyor...' : 'Gönder'}</span>
                <span className="sm:hidden">{sending ? '...' : '➤'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;