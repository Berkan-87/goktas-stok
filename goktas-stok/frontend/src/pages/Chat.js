import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { 
  PaperAirplaneIcon,
  PlusCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const Chat = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeChat, setActiveChat] = useState({ type: 'general', id: null });
  const [newMessage, setNewMessage] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', members: [] });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // 🔔 Bildirim sesi için referans
  const notificationSoundRef = useRef(null);

  // 📱 Ekran boyutunu dinle
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if(mobile && activeChat.id) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeChat]);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeChat.type === 'general') {
      fetchGeneralMessages();
    } else if (activeChat.type === 'private' && activeChat.id) {
      fetchPrivateMessages(activeChat.id);
    } else if (activeChat.type === 'group' && activeChat.id) {
      fetchGroupMessages(activeChat.id);
    }
    if (isMobile && activeChat.id) {
      setShowSidebar(false);
    }
  }, [activeChat, isMobile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🔔 BİLDİRİM FONKSİYONU
  const triggerNotification = (senderName, messageContent) => {
    // 1. Ses Çal
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play().catch(() => {});
    }

    // 2. Tarayıcı Bildirimi (Masaüstü)
    if (Notification.permission === 'granted') {
      new Notification(`${senderName} sana mesaj gönderdi!`, {
        body: messageContent.length > 30 ? messageContent.substring(0, 30) + '...' : messageContent,
        icon: '/logo192.png'
      });
    }
  };

  // Veri çekme fonksiyonları...
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Gruplar alınamadı:', error);
    }
  };

  const fetchGeneralMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/messages/general');
      setMessages(response.data);
      
      // ✅ Mesajlar çekildikten sonra, hepsini okundu işaretle!
      await axios.put('/messages/mark-all-read', { receiver: null, group: null });
      
    } catch (error) {
      console.error('Genel mesajlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivateMessages = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/messages/private/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Özel mesajlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/messages/group/${groupId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Grup mesajları alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const payload = {
        content: newMessage
      };

      if (activeChat.type === 'general') {
        payload.receiver = null;
        payload.group = null;
      } else if (activeChat.type === 'private') {
        payload.receiver = activeChat.id;
        payload.group = null;
      } else if (activeChat.type === 'group') {
        payload.receiver = null;
        payload.group = activeChat.id;
      }

      const response = await axios.post('/messages', payload);
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Mesaj gönderilemedi');
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/groups', {
        name: newGroup.name,
        description: newGroup.description,
        members: selectedUsers
      });
      toast.success('Grup oluşturuldu');
      setShowGroupModal(false);
      setNewGroup({ name: '', description: '', members: [] });
      setSelectedUsers([]);
      fetchGroups();
    } catch (error) {
      toast.error('Grup oluşturulamadı');
    }
  };

  const getUserName = (userId) => {
    const u = users.find(u => u._id === userId);
    return u ? u.name : userId;
  };

  const handleBackToMenu = () => {
    setShowSidebar(true);
    setActiveChat({ type: 'general', id: null });
  };

  // 📌 Bildirim izni al (Sayfa yüklendiğinde)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex flex-1 h-full w-full bg-gray-100 rounded-xl overflow-hidden relative shadow-lg">
      
      {/* 🔔 Sesi HTML5 Audio ile ekliyoruz */}
      <audio ref={notificationSoundRef} src="https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" preload="auto" />

      {/* ✅ SOL PANEL */}
      <div 
        className={`${
          isMobile ? 'absolute inset-0 z-10 transition-transform duration-300 w-full' : 'w-80'
        } ${
          isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'
        } bg-white border-r border-gray-200 flex flex-col h-full`}
      >
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            Sohbetler
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Genel Sohbet */}
          <button
            onClick={() => {
              setActiveChat({ type: 'general', id: null });
              if(isMobile) setShowSidebar(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
              activeChat.type === 'general' 
                ? 'bg-blue-50 text-blue-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Genel Sohbet</p>
              <p className="text-xs text-gray-500 truncate">Herkesin ortak alanı</p>
            </div>
          </button>

          {/* Özel Mesajlar */}
          <div className="mt-4 px-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Özel Mesajlar</p>
            {users.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3 text-center">Başka kullanıcı yok</p>
            ) : (
              users.map(u => (
                <button
                  key={u._id}
                  onClick={() => {
                    setActiveChat({ type: 'private', id: u._id });
                    if(isMobile) setShowSidebar(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    activeChat.type === 'private' && activeChat.id === u._id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                    {u.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">Çevrimiçi</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Gruplar */}
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gruplar</p>
              <button
                onClick={() => setShowGroupModal(true)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
              >
                <PlusCircleIcon className="h-5 w-5" />
              </button>
            </div>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3 text-center">Henüz grup yok</p>
            ) : (
              groups.map(g => (
                <button
                  key={g._id}
                  onClick={() => {
                    setActiveChat({ type: 'group', id: g._id });
                    if(isMobile) setShowSidebar(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    activeChat.type === 'group' && activeChat.id === g._id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <UserGroupIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{g.name}</p>
                    <p className="text-xs text-gray-500 truncate">{g.description || 'Grup sohbeti'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ✅ SAĞ PANEL - MESAJLAR */}
      <div className={`flex-1 flex flex-col h-full bg-[#efeae2] relative ${isMobile && showSidebar ? 'hidden' : 'flex'}`}>
        
        {/* Chat Başlığı */}
        <div className="p-3 px-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={handleBackToMenu} className="text-gray-600 hover:text-blue-600 p-1">
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
              {activeChat.type === 'general' && <UsersIcon className="h-5 w-5" />}
              {activeChat.type === 'private' && (getUserName(activeChat.id)?.charAt(0).toUpperCase() || '?')}
              {activeChat.type === 'group' && <UserGroupIcon className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {activeChat.type === 'general' && 'Genel Sohbet'}
                {activeChat.type === 'private' && getUserName(activeChat.id)}
                {activeChat.type === 'group' && (groups.find(g => g._id === activeChat.id)?.name || 'Grup')}
              </h3>
              <p className="text-xs text-green-600">Çevrimiçi</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 p-1">
            <EllipsisVerticalIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#efeae2] bg-opacity-50 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-blend-overlay">
          {loading ? (
            <div className="text-center py-12 bg-white/80 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Yükleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12 flex flex-col items-center justify-center h-full">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Henüz mesaj yok</p>
              <p className="text-sm">İlk mesajı gönder!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
              
              // ✅ OKUNMAMIŞ MESAJ KONTROLÜ (Koyu yapma mantığı)
              // Eğer kullanıcı bu mesajı okumadıysa ve mesaj başkasından geldiyse 'bold' (koyu) yap.
              const isUnread = !isOwn && !msg.readBy?.includes(user._id);

              return (
                <div
                  key={index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[60%] rounded-lg px-3 py-2 shadow-sm relative ${
                      isOwn
                        ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {!isOwn && (
                      <p className={`text-xs font-bold text-blue-600 mb-1 ${isUnread ? 'font-extrabold' : ''}`}>
                        {msg.sender?.name || 'Bilinmeyen'}
                      </p>
                    )}
                    {/* 📌 KOYU (BOLD) MESAJ MANTIĞI BURADA: */}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isUnread ? 'font-bold text-gray-900' : 'font-normal text-gray-700'}`}>
                      {msg.content}
                    </p>
                    <p className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      {isOwn && <span className="text-blue-500 text-[10px]">✓✓</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mesaj Gönderme Alanı */}
        <form onSubmit={sendMessage} className="p-3 bg-[#f0f2f5] border-t border-gray-200 flex items-center gap-2 sticky bottom-0">
          <button type="button" className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition">
             <PlusCircleIcon className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mesaj yazın..."
            className="flex-1 rounded-full px-4 py-2 border-none focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          />
          <button
            type="submit"
            className={`p-2 rounded-full transition-all ${
              newMessage.trim() 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-gray-300'
            }`}
            disabled={!newMessage.trim()}
          >
            <PaperAirplaneIcon className="h-6 w-6 rotate-45" />
          </button>
        </form>
      </div>

      {/* Grup Oluşturma Modalı */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserGroupIcon className="h-6 w-6" />
                Yeni Grup
              </h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={createGroup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grup Adı *</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="input-field"
                    placeholder="Takım Sohbeti"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    className="input-field"
                    rows="2"
                    placeholder="Grup açıklaması..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Üyeler</label>
                  <select
                    multiple
                    className="input-field h-32"
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, o => o.value);
                      setSelectedUsers(selected);
                    }}
                  >
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Ctrl ile çoklu seçim yapabilirsiniz</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Oluştur
                </button>
                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 btn-secondary">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;