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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const Chat = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState({ type: 'general', id: null });
  const [newMessage, setNewMessage] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', members: [] });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 rounded-xl overflow-hidden">
      {/* Sol Panel - Kullanıcılar ve Gruplar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Sohbet
          </h3>
          
          {/* Genel Sohbet */}
          <button
            onClick={() => setActiveChat({ type: 'general', id: null })}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center gap-2 ${
              activeChat.type === 'general' 
                ? 'bg-blue-50 text-blue-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            Genel Sohbet
          </button>
        </div>

        {/* Özel Mesajlar */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4" />
            Özel Mesajlar
          </h4>
          {users.length === 0 ? (
            <p className="text-sm text-gray-400 px-3 py-2">Başka kullanıcı yok</p>
          ) : (
            users.map(u => (
              <button
                key={u._id}
                onClick={() => setActiveChat({ type: 'private', id: u._id })}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center gap-2 ${
                  activeChat.type === 'private' && activeChat.id === u._id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {u.name?.charAt(0).toUpperCase() || '?'}
                </div>
                {u.name}
              </button>
            ))
          )}
        </div>

        {/* Gruplar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4" />
              Gruplar
            </h4>
            <button
              onClick={() => setShowGroupModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </button>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-gray-400 px-3 py-2">Henüz grup yok</p>
          ) : (
            groups.map(g => (
              <button
                key={g._id}
                onClick={() => setActiveChat({ type: 'group', id: g._id })}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center gap-2 ${
                  activeChat.type === 'group' && activeChat.id === g._id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                {g.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sağ Panel - Mesajlar */}
      <div className="flex-1 flex flex-col">
        {/* Chat Başlığı */}
        <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">
            {activeChat.type === 'general' && '🌐 Genel Sohbet'}
            {activeChat.type === 'private' && `💌 ${getUserName(activeChat.id)}`}
            {activeChat.type === 'group' && `👥 ${groups.find(g => g._id === activeChat.id)?.name || 'Grup'}`}
          </h3>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Yükleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Henüz mesaj yok</p>
              <p className="text-sm">İlk mesajı gönder!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
              return (
                <div
                  key={index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white shadow'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-sm font-medium text-gray-600">
                        {msg.sender?.name || 'Bilinmeyen'}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mesaj Gönderme */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesaj yazın..."
              className="flex-1 input-field"
            />
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={!newMessage.trim()}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              Gönder
            </button>
          </div>
        </form>
      </div>

      {/* Grup Oluşturma Modalı */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserGroupIcon className="h-6 w-6" />
                Yeni Grup Oluştur
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grup Adı *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    className="input-field"
                    rows="2"
                    placeholder="Grup açıklaması..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Üyeler
                  </label>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Ctrl tuşuyla birden fazla kişi seçebilirsiniz
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 btn-secondary"
                >
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