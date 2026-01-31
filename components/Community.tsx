
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';

interface PostComment {
  id: string;
  authorId: string;
  author: string;
  content: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  helpfulBy: string[]; // List of user IDs who found this helpful
}

interface Post {
  id: string;
  authorId: string;
  author: string;
  avatar?: string;
  content: string;
  type: 'notice' | 'poll' | 'general' | 'event';
  timestamp: string;
  likes: number;
  commentsList: PostComment[];
  college: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

interface GroupMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe?: boolean;
}

interface StudyGroup {
  id: string;
  name: string;
  members: number;
  active: boolean;
  description: string;
  messages: GroupMessage[];
}

interface CommunityUser {
  id: string;
  name: string;
  college: string;
  year: string;
  points: number;
  bio?: string;
}

interface CommunityProps {
  profile: UserProfile | null;
}

const Community: React.FC<CommunityProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'marketplace'>('feed');
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set(['1']));
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMessageInput, setGroupMessageInput] = useState('');
  
  // Profile Discovery State
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<Set<string>>(new Set(['u3'])); // Start with one friend for demo
  const [pendingMessages, setPendingMessages] = useState<Record<string, string>>({}); // Simulated direct message feedback
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Simulated Community Users with points
  const [communityUsers, setCommunityUsers] = useState<Record<string, CommunityUser>>({
    'current': {
      id: 'current',
      name: profile?.name || 'Me',
      college: profile?.college || 'University Hub',
      year: profile?.year || '1st Year',
      points: 450,
      bio: "Learning and growing every day! 🚀"
    },
    'u1': {
      id: 'u1',
      name: 'Aman Varma',
      college: 'IIT Delhi',
      year: '3rd Year',
      points: 1250,
      bio: "Physics enthusiast and part-time developer."
    },
    'u2': {
      id: 'u2',
      name: 'Rahul Sharma',
      college: 'DTU',
      year: '2nd Year',
      points: 85,
      bio: "Content creator and drone pilot."
    },
    'u3': {
      id: 'u3',
      name: 'Sanya Malhotra',
      college: 'BITS Pilani',
      year: '4th Year',
      points: 3200,
      bio: "Helping juniors with DSA and placements!"
    }
  });

  const [posts, setPosts] = useState<Post[]>([
    {
      id: '2',
      authorId: 'u2',
      author: 'Rahul Sharma',
      content: 'Check out the drone footage I captured of the tech fest! The campus looks amazing from above.',
      type: 'general',
      timestamp: '5h ago',
      likes: 125,
      commentsList: [
        { id: 'c2', authorId: 'u3', author: 'Sanya M.', content: 'This is incredible! Can you share the raw files?', timestamp: '2h ago', helpfulBy: ['current'] }
      ],
      college: 'DTU',
      mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
      mediaType: 'image'
    },
    {
      id: '3',
      authorId: 'u1',
      author: 'Aman Varma',
      content: 'Does anyone have a good resource for understanding Maxwell equations in a simple way?',
      type: 'general',
      timestamp: '1h ago',
      likes: 12,
      commentsList: [],
      college: 'IIT Delhi'
    }
  ]);

  const [groups] = useState<StudyGroup[]>([
    { id: '1', name: 'Physics S2 Study', members: 24, active: true, description: 'Discussing Quantum Mechanics and Thermodynamics.', messages: [] },
    { id: '2', name: 'DSA Interview Prep', members: 156, active: true, description: 'Cracking Big Tech interviews together.', messages: [] },
    { id: '3', name: 'Semester 1 Seniors', members: 89, active: false, description: 'Advice and notes from your seniors.', messages: [] }
  ]);

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
  const [commentMedia, setCommentMedia] = useState<Record<string, {url: string, type: 'image' | 'video'} | null>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<Record<string, HTMLInputElement | null>>({});

  const showNotification = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getLevel = (pts: number) => {
    if (pts >= 3000) return { name: 'Campus Legend', color: 'text-rose-500 bg-rose-50 border-rose-100', icon: 'fa-crown', hex: '#f43f5e' };
    if (pts >= 1500) return { name: 'Expert', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: 'fa-gem', hex: '#d97706' };
    if (pts >= 500) return { name: 'Mentor', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: 'fa-shield-halved', hex: '#4f46e5' };
    if (pts >= 100) return { name: 'Scholar', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: 'fa-medal', hex: '#059669' };
    return { name: 'Freshman', color: 'text-slate-500 bg-slate-50 border-slate-100', icon: 'fa-seedling', hex: '#64748b' };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'post' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const result = { url: event.target?.result as string, type: type as 'image' | 'video' };
      if (target === 'post') setNewPostMedia(result);
      else setCommentMedia({ ...commentMedia, [target]: result });
    };
    reader.readAsDataURL(file);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostMedia) return;
    const newPost: Post = {
      id: Date.now().toString(),
      authorId: 'current',
      author: profile?.name || 'Anonymous',
      content: newPostContent,
      type: 'general',
      timestamp: 'Just now',
      likes: 0,
      commentsList: [],
      college: profile?.college || 'University Hub',
      mediaUrl: newPostMedia?.url,
      mediaType: newPostMedia?.type
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostMedia(null);
    showNotification("Buzz shared successfully!", "success");
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId];
    const media = commentMedia[postId];
    if (!text?.trim() && !media) return;
    const comment: PostComment = {
      id: Date.now().toString(),
      authorId: 'current',
      author: profile?.name || 'Anonymous',
      content: text || '',
      timestamp: 'Just now',
      mediaUrl: media?.url,
      mediaType: media?.type,
      helpfulBy: []
    };
    setPosts(posts.map(p => p.id === postId ? { ...p, commentsList: [...p.commentsList, comment] } : p));
    setNewCommentText({ ...newCommentText, [postId]: '' });
    setCommentMedia({ ...commentMedia, [postId]: null });
  };

  const toggleHelpful = (postId: string, commentId: string) => {
    const currentUserId = 'current';
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        commentsList: p.commentsList.map(c => {
          if (c.id !== commentId) return c;
          
          const isMarked = c.helpfulBy.includes(currentUserId);
          const newHelpfulBy = isMarked 
            ? c.helpfulBy.filter(id => id !== currentUserId)
            : [...c.helpfulBy, currentUserId];

          // Award 10 points
          if (!isMarked && c.authorId !== currentUserId) {
            setCommunityUsers(prev => {
              const u = prev[c.authorId];
              if (!u) return prev;
              return {
                ...prev,
                [c.authorId]: { ...u, points: u.points + 10 }
              };
            });
            showNotification(`Awarded 10 reputation points to ${c.author}!`, "success");
          } else if (isMarked && c.authorId !== currentUserId) {
            setCommunityUsers(prev => {
              const u = prev[c.authorId];
              if (!u) return prev;
              return {
                ...prev,
                [c.authorId]: { ...u, points: Math.max(0, u.points - 10) }
              };
            });
          }

          return { ...c, helpfulBy: newHelpfulBy };
        })
      };
    }));
  };

  const toggleFriend = (userId: string) => {
    const next = new Set(friendsList);
    if (next.has(userId)) {
      next.delete(userId);
      const user = communityUsers[userId];
      showNotification(`Removed ${user ? user.name : 'User'} from friends.`);
    } else {
      next.add(userId);
      const user = communityUsers[userId];
      showNotification(`Added ${user ? user.name : 'User'} to friends!`, "success");
    }
    setFriendsList(next);
  };

  const handleSendMessage = (userId: string) => {
    const user = communityUsers[userId];
    const userName = user ? user.name : 'User';
    showNotification(`Message request sent to ${userName}. They'll be notified!`, "success");
  };

  const openProfile = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setViewingUserId(userId);
  };

  const viewedUser = viewingUserId ? communityUsers[viewingUserId] : null;

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 relative">
      
      {/* Universal Notifications */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
        }`}>
          <i className={`fa-solid ${notification.type === 'success' ? 'fa-circle-check' : 'fa-info-circle'}`}></i>
          <p className="text-xs font-bold uppercase tracking-widest">{notification.message}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Campus Buzz</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Peer-to-peer academic community.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 self-start md:self-end">
          {(['feed', 'groups', 'marketplace'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'feed' && (
            <>
              {/* Create Post */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <form onSubmit={handlePost} className="space-y-4">
                  <div className="flex gap-4">
                    <button type="button" onClick={(e) => openProfile(e, 'current')} className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all">
                      {profile?.name?.charAt(0) || 'U'}
                    </button>
                    <div className="flex-1 space-y-4">
                      <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none min-h-[100px] dark:text-white"
                        placeholder="Share a doubt, resource, or update with fellow students..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                      />
                      {newPostMedia && (
                        <div className="relative inline-block">
                          {newPostMedia.type === 'image' ? (
                            <img src={newPostMedia.url} className="max-h-64 rounded-2xl border border-slate-100" />
                          ) : (
                            <video src={newPostMedia.url} className="max-h-64 rounded-2xl border border-slate-100" controls />
                          )}
                          <button type="button" onClick={() => setNewPostMedia(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800 pt-4">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors flex items-center justify-center">
                      <i className="fa-solid fa-image"></i>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileSelect(e, 'post')} />
                    <button type="submit" disabled={!newPostContent.trim() && !newPostMedia} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                      Post Buzz
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Posts */}
              <div className="space-y-6">
                {posts.map((post) => {
                  const author = communityUsers[post.authorId] || { name: post.author, college: post.college, points: 0 };
                  const level = getLevel(author.points);
                  
                  return (
                    <div key={post.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                          <button onClick={(e) => openProfile(e, post.authorId)} className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-transparent hover:border-indigo-500 transition-all overflow-hidden">
                            {post.author.charAt(0)}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 onClick={(e) => openProfile(e, post.authorId)} className="font-bold text-slate-800 dark:text-white text-sm cursor-pointer hover:text-indigo-600">{post.author}</h4>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${level.color} flex items-center gap-1`}>
                                <i className={`fa-solid ${level.icon}`}></i> {level.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{post.timestamp} • {post.college}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{post.content}</p>
                      {post.mediaUrl && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-96">
                          {post.mediaType === 'image' ? (
                             <img src={post.mediaUrl} className="w-full h-auto object-cover" />
                          ) : (
                             <video src={post.mediaUrl} className="w-full h-auto object-cover" controls />
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-6 border-t border-slate-50 dark:border-slate-800 pt-4">
                        <button onClick={() => setPosts(posts.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p))} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">
                          <i className="fa-regular fa-heart"></i> {post.likes}
                        </button>
                        <button onClick={() => {
                          const next = new Set(expandedPostIds);
                          if (next.has(post.id)) next.delete(post.id); else next.add(post.id);
                          setExpandedPostIds(next);
                        }} className={`flex items-center gap-2 text-xs font-bold transition-colors ${expandedPostIds.has(post.id) ? 'text-indigo-600' : 'text-slate-400'}`}>
                          <i className="fa-regular fa-comment"></i> {post.commentsList.length} Discussion
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedPostIds.has(post.id) && (
                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-6">
                          {post.commentsList.map(c => {
                            const cAuthor = communityUsers[c.authorId] || { name: c.author, points: 0 };
                            const cLevel = getLevel(cAuthor.points);
                            const isHelpful = c.helpfulBy.includes('current');
                            
                            return (
                              <div key={c.id} className={`flex gap-3 p-4 rounded-3xl transition-all ${isHelpful ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <button onClick={(e) => openProfile(e, c.authorId)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-500 flex-shrink-0 border-2 border-transparent hover:border-indigo-400 transition-all overflow-hidden">
                                  {c.author.charAt(0)}
                                </button>
                                <div className="flex-1 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <p onClick={(e) => openProfile(e, c.authorId)} className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:text-indigo-600">{c.author}</p>
                                      <span className={`text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded border ${cLevel.color}`}>
                                        <i className={`fa-solid ${cLevel.icon} mr-1`}></i> {cLevel.name}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => toggleHelpful(post.id, c.id)}
                                      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${isHelpful ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}
                                    >
                                      <i className="fa-solid fa-thumbs-up"></i>
                                      {isHelpful ? 'Helpful!' : 'Helpful?'}
                                      {c.helpfulBy.length > 0 && <span className="opacity-60 ml-1">{c.helpfulBy.length}</span>}
                                    </button>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                                  {c.mediaUrl && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-sm">
                                      {c.mediaType === 'image' ? (
                                        <img src={c.mediaUrl} className="w-full h-auto" />
                                      ) : (
                                        <video src={c.mediaUrl} className="w-full h-auto" controls />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Comment Input */}
                          <div className="space-y-3">
                            {commentMedia[post.id] && (
                              <div className="relative inline-block ml-11">
                                {commentMedia[post.id]?.type === 'image' ? (
                                  <img src={commentMedia[post.id]?.url} className="h-20 rounded-xl border border-slate-200 shadow-sm" />
                                ) : (
                                  <video src={commentMedia[post.id]?.url} className="h-20 rounded-xl border border-slate-200 shadow-sm" />
                                )}
                                <button type="button" onClick={() => setCommentMedia({...commentMedia, [post.id]: null})} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-sm"><i className="fa-solid fa-xmark"></i></button>
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <button 
                                type="button" 
                                onClick={() => commentFileInputRef.current[post.id]?.click()} 
                                className="w-10 h-10 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors flex items-center justify-center border border-slate-100 dark:border-slate-700"
                              >
                                <i className="fa-solid fa-paperclip"></i>
                              </button>
                              <input 
                                type="file" 
                                ref={el => commentFileInputRef.current[post.id] = el} 
                                className="hidden" 
                                accept="image/*,video/*" 
                                onChange={(e) => handleFileSelect(e, post.id)} 
                              />
                              <input 
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white" 
                                placeholder="Share an answer or helpful tip..." 
                                value={newCommentText[post.id] || ''} 
                                onChange={e => setNewCommentText({...newCommentText, [post.id]: e.target.value})}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                              />
                              <button onClick={() => handleAddComment(post.id)} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors active:scale-95"><i className="fa-solid fa-paper-plane text-xs"></i></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group/card transition-all hover:shadow-lg">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-xl">
                        <i className="fa-solid fa-user-group"></i>
                      </div>
                      {group.active && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">{group.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{group.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.members} Students</p>
                  </div>
                  <button className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Join Group</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* User Reputation Card */}
          <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={(e) => openProfile(e, 'current')} className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black border border-white/30 overflow-hidden">
                  {profile?.name?.charAt(0) || 'U'}
                </button>
                <div>
                  <h4 className="font-bold text-sm truncate">{profile?.name || 'User'}</h4>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{getLevel(communityUsers['current'].points).name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-xl font-black">{communityUsers['current'].points}</p>
                  <p className="text-[7px] font-black uppercase opacity-60">Points</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-xl font-black">Lvl {Math.floor(communityUsers['current'].points / 100) + 1}</p>
                  <p className="text-[7px] font-black uppercase opacity-60">Status</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">My Friends</h4>
            <div className="space-y-4">
              {Array.from(friendsList).map((fid: string) => (
                <div key={fid} onClick={(e) => openProfile(e, fid)} className="flex items-center gap-3 group cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-black overflow-hidden">
                    {communityUsers[fid]?.name.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{communityUsers[fid]?.name || 'Friend'}</p>
                    <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Online</p>
                  </div>
                </div>
              ))}
              {friendsList.size === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center">No friends added yet. Connect with students in the feed!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Spotlight Modal */}
      {viewingUserId && viewedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header / Banner */}
            <div className="h-28 bg-gradient-to-br from-indigo-500 to-indigo-800 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setViewingUserId(null)} className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="absolute -bottom-10 left-8 p-1.5 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl">
                 <div className="w-24 h-24 bg-indigo-100 dark:bg-slate-800 rounded-[1.8rem] flex items-center justify-center text-4xl font-black text-indigo-600 overflow-hidden border-2 border-white dark:border-slate-800">
                  {viewedUser.name.charAt(0)}
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="px-8 pb-8 pt-12">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{viewedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getLevel(viewedUser.points).color}`}>
                      <i className={`fa-solid ${getLevel(viewedUser.points).icon} mr-1`}></i>
                      {getLevel(viewedUser.points).name}
                    </span>
                    {friendsList.has(viewingUserId) && <span className="text-[8px] bg-emerald-100 text-emerald-600 font-bold px-1.5 py-0.5 rounded uppercase">Friend</span>}
                  </div>
                </div>
                {viewingUserId !== 'current' && (
                  <button 
                    onClick={() => toggleFriend(viewingUserId!)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      friendsList.has(viewingUserId!) 
                        ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    <i className={`fa-solid ${friendsList.has(viewingUserId!) ? 'fa-user-minus' : 'fa-user-plus'}`}></i>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-xl border border-slate-200 dark:border-slate-700">
                  <i className="fa-solid fa-building-columns mr-1"></i> {viewedUser.college}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-xl border border-slate-200 dark:border-slate-700">
                  <i className="fa-solid fa-graduation-cap mr-1"></i> {viewedUser.year}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-3xl font-black text-slate-800 dark:text-white">{viewedUser.points}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Reputation</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                  <div className="flex gap-1 mb-1" style={{ color: getLevel(viewedUser.points).hex }}>
                    {[1, 2, 3, 4, 5].map(s => <i key={s} className={`fa-solid fa-star text-[8px] ${s > Math.ceil(viewedUser.points / 1000) ? 'opacity-20' : ''}`}></i>)}
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Rank</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative mb-8">
                <i className="fa-solid fa-quote-left absolute -top-3 left-6 text-2xl text-indigo-500/20"></i>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{viewedUser.bio}"</p>
              </div>
              
              {viewingUserId !== 'current' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleSendMessage(viewingUserId!)}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
