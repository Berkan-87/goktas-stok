// frontend/src/pages/Chat.js
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
  MagnifyingGlassIcon,
  CheckBadgeIcon
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
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💬 Yeni Mesaj', {
        body: `${message.sender?.name || 'Kullanıcı'}: ${message.content}`,
        icon: '/favicon.ico',
        tag: 'chat-message',
        requireInteraction: true
      });
    }

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message.sender?.name || 'Kullanıcı'}</p>
              <p className="text-sm text-gray-500">{message.content}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(message.createdAt).toLocaleTimeString('tr-TR')}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500">
            Kapat
          </button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-right' });
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
    const interval = setInterval(fetchUsersAndGroups, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsersAndGroups = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/groups')
      ]);
      
      const filteredUsers = usersRes.data.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
      setGroups(groupsRes.data);
      
      const chats = [];
      chats.push({ id: 'general', type: 'general', name: '💬 Genel Sohbet', icon: '💬' });
      
      filteredUsers.forEach(u => {
        chats.push({
          id: u._id,
          type: 'private',
          name: u.name || u.username || 'İsimsiz',
          icon: '👤',
          role: u.role || 'Kullanıcı'
        });
      });
      
      groupsRes.data.forEach(g => {
        chats.push({ id: g._id, type: 'group', name: g.name, icon: '👥' });
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
      const newMessages = response.data || [];
      
      if (!isFirstLoad.current && messages.length > 0) {
        const oldIds = new Set(messages.map(m => m._id));
        const newMsg = newMessages.find(m => !oldIds.has(m._id));
        if (newMsg && newMsg.sender?._id !== user._id) {
          console.log('🔔 Yeni mesaj geldi:', newMsg);
          showNotification(newMsg);
          playSound();
          reorderChats();
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      updateUnreadCounts();
    } catch (error) {
      console.error('❌ Mesajlar alınamadı:', error);
      toast.error('Mesajlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Özel mesajları getir
  const fetchPrivateMessages = async (userId) => {
    try {
      const response = await axios.get(`/messages/private/${userId}`);
      const newMessages = response.data || [];
      
      if (!isFirstLoad.current && messages.length > 0) {
        const oldIds = new Set(messages.map(m => m._id));
        const newMsg = newMessages.find(m => !oldIds.has(m._id));
        if (newMsg && newMsg.sender?._id !== user._id) {
          console.log('🔔 Yeni özel mesaj geldi:', newMsg);
          showNotification(newMsg);
          playSound();
          reorderChats();
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      await markAllAsRead('private', userId);
      updateUnreadCounts();
    } catch (error) {
      console.error('❌ Özel mesajlar alınamadı:', error);
      toast.error('Mesajlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Grup mesajlarını getir
  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await axios.get(`/messages/group/${groupId}`);
      const newMessages = response.data || [];
      
      if (!isFirstLoad.current && messages.length > 0) {
        const oldIds = new Set(messages.map(m => m._id));
        const newMsg = newMessages.find(m => !oldIds.has(m._id));
        if (newMsg && newMsg.sender?._id !== user._id) {
          console.log('🔔 Yeni grup mesajı geldi:', newMsg);
          showNotification(newMsg);
          playSound();
          reorderChats();
        }
      }
      
      setMessages(newMessages);
      isFirstLoad.current = false;
      await markAllAsRead('group', groupId);
      updateUnreadCounts();
    } catch (error) {
      console.error('❌ Grup mesajları alınamadı:', error);
      toast.error('Mesajlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sohbet listesini en son mesaja göre sırala
  const reorderChats = () => {
    setActiveChats(prev => {
      if (!prev || prev.length === 0) return prev;
      
      const generalChat = prev.find(c => c && c.id === 'general');
      const otherChats = prev.filter(c => c && c.id !== 'general');
      
      const sortedChats = otherChats.sort((a, b) => {
        const lastMsgA = getLastMessageTime(a.id);
        const lastMsgB = getLastMessageTime(b.id);
        return lastMsgB - lastMsgA;
      });
      
      return generalChat ? [generalChat, ...sortedChats] : sortedChats;
    });
  };

  // ✅ Bir sohbetin en son mesaj zamanını bul
  const getLastMessageTime = (chatId) => {
    if (!messages || messages.length === 0) return 0;
    
    try {
      if (chatType === 'general') {
        const msg = messages.find(m => !m.receiver && !m.group);
        return msg ? new Date(msg.createdAt).getTime() : 0;
      } else if (chatType === 'private') {
        const msg = messages.find(m => 
          (m.sender?._id === chatId || m.receiver === chatId) && !m.group
        );
        return msg ? new Date(msg.createdAt).getTime() : 0;
      } else if (chatType === 'group') {
        const msg = messages.find(m => m.group === chatId);
        return msg ? new Date(msg.createdAt).getTime() : 0;
      }
    } catch (error) {
      console.error('getLastMessageTime hatası:', error);
    }
    return 0;
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
      
      setMessages(prev => prev.map(m => ({
        ...m,
        readBy: [...(m.readBy || []), user._id]
      })));
      
      updateUnreadCounts();
      
      // ✅ Badge'i sıfırla
      const response = await axios.get('/messages/unread-count');
      const count = response.data?.total || 0;
      localStorage.setItem('chatUnreadCount', String(count));
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Tüm mesajlar okundu olarak işaretlendi');
    } catch (error) {
      console.error('Okundu işaretleme hatası:', error);
    }
  };

  // ✅ Tek mesajı okundu işaretle
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`/messages/read/${messageId}`);
      
      setMessages(prev => prev.map(m => {
        if (m._id === messageId && !m.readBy?.includes(user._id)) {
          return { ...m, readBy: [...(m.readBy || []), user._id] };
        }
        return m;
      }));
      
      updateUnreadCounts();
      
      // ✅ Badge'i güncelle
      const response = await axios.get('/messages/unread-count');
      const count = response.data?.total || 0;
      localStorage.setItem('chatUnreadCount', String(count));
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error('Mesaj okuma hatası:', error);
    }
    // Chat.js - markMessageAsRead sonuna ekleyin
    const markMessageAsRead = async (messageId) => {
      try {
        await axios.put(`/messages/read/${messageId}`);
        
        // ... state güncellemeleri ...
        
        // ✅ ZORLA SIFIRLA
        localStorage.setItem('chatUnreadCount', '0');
        window.dispatchEvent(new Event('storage'));
        
        // ✅ State'i doğrudan güncelle
        window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
          detail: { count: 0 } 
        }));
        
      } catch (error) {
        console.error('Mesaj okuma hatası:', error);
      }
    };

  };

  // ✅ Okunmamış sayılarını güncelle
  const updateUnreadCounts = () => {
    if (!activeChats || activeChats.length === 0) return;
    
    const counts = {};
    let totalUnread = 0;
    
    activeChats.forEach(chat => {
      if (!chat) return;
      
      let count = 0;
      if (chat.type === 'general') {
        count = messages.filter(m => 
          !m.readBy?.includes(user._id) && 
          m.sender?._id !== user._id &&
          !m.receiver && !m.group
        ).length;
      } else if (chat.type === 'private') {
        count = messages.filter(m => 
          !m.readBy?.includes(user._id) && 
          m.sender?._id !== user._id &&
          (m.sender?._id === chat.id || m.receiver === chat.id)
        ).length;
      } else if (chat.type === 'group') {
        count = messages.filter(m => 
          !m.readBy?.includes(user._id) && 
          m.sender?._id !== user._id &&
          m.group === chat.id
        ).length;
      }
      
      counts[chat.id] = count;
      totalUnread += count;
    });
    
    setUnreadCounts(counts);
    
    // ✅ LocalStorage'a yaz ve event gönder
    const currentTotal = parseInt(localStorage.getItem('chatUnreadCount')) || 0;
    if (currentTotal !== totalUnread) {
      localStorage.setItem('chatUnreadCount', String(totalUnread));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // ✅ Mesaj gönder
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      let payload = { content: newMessage.trim() };

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
      
      setMessages(prev => [newMsg, ...prev]);
      setNewMessage('');
      
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
    if (!message || !message.readBy) return true;
    return !message.readBy.includes(user._id) && message.sender?._id !== user._id;
  };

  // ✅ Okunmamış mesaj sayısını al
  const getUnreadCount = (chatId) => {
    if (!unreadCounts) return 0;
    return unreadCounts[chatId] || 0;
  };

  // ✅ Sohbet listesinde en son mesajı bul
  const getLastMessage = (chatId) => {
    if (!messages || messages.length === 0) return null;
    
    try {
      let lastMsg = null;
      if (chatType === 'general') {
        lastMsg = messages.find(m => !m.receiver && !m.group);
      } else if (chatType === 'private') {
        lastMsg = messages.find(m => 
          (m.sender?._id === chatId || m.receiver === chatId) && !m.group
        );
      } else if (chatType === 'group') {
        lastMsg = messages.find(m => m.group === chatId);
      }
      return lastMsg;
    } catch (error) {
      console.error('getLastMessage hatası:', error);
      return null;
    }
  };

  useEffect(() => {
    updateUnreadCounts();
  }, [messages, activeChats]);

  // ✅ Otomatik yenileme (2 saniye)
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatType === 'general') {
        fetchGeneralMessages();
      } else if (chatType === 'private' && selectedUser) {
        fetchPrivateMessages(selectedUser);
      } else if (chatType === 'group' && selectedGroup) {
        fetchGroupMessages(selectedGroup);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [chatType, selectedUser, selectedGroup]);

  // ✅ Arama filtresi
  const filteredChats = (activeChats && activeChats.length > 0) 
    ? activeChats.filter(chat => 
        chat && chat.name && chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : [];

  // ✅ Mesaja tıklandığında okundu işaretle
  const handleMessageClick = (message) => {
    if (message && isUnread(message)) {
      markMessageAsRead(message._id);
    }
  };

  // ✅ Sohbet listesini sıralı göster
  const sortedChats = (filteredChats && filteredChats.length > 0) 
    ? [...filteredChats].sort((a, b) => {
        if (!a || !b) return 0;
        if (a.id === 'general') return -1;
        if (b.id === 'general') return 1;
        
        const lastA = getLastMessage(a.id);
        const lastB = getLastMessage(b.id);
        const timeA = lastA ? new Date(lastA.createdAt).getTime() : 0;
        const timeB = lastB ? new Date(lastB.createdAt).getTime() : 0;
        return timeB - timeA;
      })
    : [];

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
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 truncate">{getChatTitle()}</h2>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          lg:relative lg:w-72 lg:flex lg:flex-col
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">💬 Sohbetler</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="hidden lg:block p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">💬 Sohbetler</h2>
                <span className="text-xs text-gray-400">{activeChats.length - 1} kişi</span>
              </div>
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
            {sortedChats.length > 0 ? (
              sortedChats.map((chat) => {
                if (!chat) return null;
                const unread = getUnreadCount(chat.id);
                const lastMsg = getLastMessage(chat.id);
                const lastMsgTime = lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => changeChat(chat)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-l-4 ${
                      (chatType === 'general' && chat.type === 'general') ||
                      (chatType === 'private' && chat.type === 'private' && selectedUser === chat.id) ||
                      (chatType === 'group' && chat.type === 'group' && selectedGroup === chat.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl flex-shrink-0">{chat.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${unread > 0 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                            {chat.name}
                          </span>
                          {unread > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        {lastMsg && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs truncate ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                              {lastMsg.sender?.name === user?.name ? 'Sen: ' : ''}
                              {lastMsg.content?.length > 30 ? lastMsg.content.substring(0, 30) + '...' : lastMsg.content}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{lastMsgTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                {searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz sohbet yok'}
              </div>
            )}

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">👥 {users.length} kullanıcı ile sohbet edebilirsin</p>
            </div>
          </div>
        </div>

        {/* Mobil overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Ana Sohbet Alanı */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {/* Desktop Başlık */}
          <div className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{getChatTitle()}</h2>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 animate-pulse">
                  {totalUnread} yeni
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
              >
                {soundEnabled ? <BellIcon className="h-5 w-5" /> : <BellSlashIcon className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`p-2 rounded-lg transition-colors ${notificationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
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
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>
          </div>

          {/* Mesaj Listesi */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Henüz mesaj yok</p>
                <p className="text-sm text-gray-300 mt-1">İlk mesajı sen gönder!</p>
              </div>
            ) : (
              messages.map((message) => {
                if (!message) return null;
                const isOwn = message.sender?._id === user._id;
                const unread = isUnread(message);
                
                return (
                  <div
                    key={message._id}
                    onClick={() => handleMessageClick(message)}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} cursor-pointer animate-slideIn`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 transition-all ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : unread
                          ? 'bg-gray-800 text-white shadow-lg ring-2 ring-yellow-400'
                          : 'bg-white text-gray-900 border border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium opacity-80">
                          {isOwn ? 'Ben' : message.sender?.name || 'Kullanıcı'}
                        </span>
                        {unread && (
                          <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                            ● YENİ
                          </span>
                        )}
                        {!unread && !isOwn && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckBadgeIcon className="h-3 w-3 text-blue-500" />
                            Okundu
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