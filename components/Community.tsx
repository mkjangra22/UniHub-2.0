
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { recordAcademicAction } from '../services/streakService';
import { fetchCommunityData, saveCommunityData, fetchUserDataFromFirestore, saveUserDataToFirestore } from '../services/dbService';

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
  likedBy: string[];
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
  classSection?: string;
  points: number;
  bio?: string;
  avatarUrl?: string;
}

interface MarketplaceItem {
  id: string;
  title: string;
  type: 'book' | 'notes' | 'other';
  purpose: 'sell' | 'exchange' | 'donate';
  price?: number;
  exchangeFor?: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  description: string;
  author: string;
  authorId: string;
  college: string;
  timestamp: string;
  imageUrl?: string;
  contactDetails?: string;
}

interface CommunityProps {
  profile: UserProfile | null;
}

const Community: React.FC<CommunityProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'marketplace' | 'discover'>('feed');
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_joined_groups`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMessageInput, setGroupMessageInput] = useState('');
  
  // Profile Discovery State
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<Set<string>>(() => {
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_friends`);
      return saved ? new Set(JSON.parse(saved)) : new Set(['u3']);
    } catch {
      return new Set(['u3']);
    }
  });
  const [pendingMessages, setPendingMessages] = useState<Record<string, string>>({}); // Simulated direct message feedback
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const isLoadedRef = useRef(false);

  // Simulated Community Users with points
  const [communityUsers, setCommunityUsers] = useState<Record<string, CommunityUser>>(() => {
    const userCollege = profile?.college || 'PIET';
    const userYear = profile?.year || '1st Year';
    const userSection = profile?.classSection || 'Section A';
    const defaultUsers = {
      'current': {
        id: 'current',
        name: profile?.name || 'Me',
        college: userCollege,
        year: userYear,
        classSection: userSection,
        points: 450,
        bio: "Learning and growing every day! 🚀"
      },
      'u1': {
        id: 'u1',
        name: 'Aman Varma',
        college: 'IIT Delhi',
        year: '3rd Year',
        classSection: 'Section B',
        points: 1250,
        bio: "Physics enthusiast and part-time developer."
      },
      'u2': {
        id: 'u2',
        name: 'Rahul Sharma',
        college: 'DTU',
        year: '2nd Year',
        classSection: 'Section A',
        points: 85,
        bio: "Content creator and drone pilot."
      },
      'u3': {
        id: 'u3',
        name: 'Sanya Malhotra',
        college: 'BITS Pilani',
        year: '4th Year',
        classSection: 'Section A',
        points: 3200,
        bio: "Helping juniors with DSA and placements!"
      },
      'u4': {
        id: 'u4',
        name: 'Karan Kapoor',
        college: userCollege,
        year: userYear,
        classSection: userSection, // Classmate!
        points: 210,
        bio: "Classmate! Web Developer and hackathon enthusiast. Let's build stuff!"
      },
      'u5': {
        id: 'u5',
        name: 'Neha Gupta',
        college: userCollege,
        year: '3rd Year', // College peer! (different year)
        classSection: 'Section B',
        points: 870,
        bio: "UI/UX Designer. Ask me about wireframing and design systems."
      },
      'u6': {
        id: 'u6',
        name: 'Rohan Mehta',
        college: 'DTU',
        year: userYear,
        classSection: 'Section B',
        points: 140,
        bio: "Competitive programmer. C++ is life. 💻"
      },
      'u7': {
        id: 'u7',
        name: 'Priya Sharma',
        college: userCollege,
        year: userYear,
        classSection: userSection, // Classmate!
        points: 520,
        bio: "Avid reader, math tutor, and semester exam prepper."
      },
      'u8': {
        id: 'u8',
        name: 'Vikas Hooda',
        college: userCollege,
        year: userYear,
        classSection: 'Section C', // College peer! (different section)
        points: 165,
        bio: "Cricket lover and electronics hobbyist."
      }
    };
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_users`);
      return saved ? JSON.parse(saved) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const defaultPosts: Post[] = [
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
        mediaType: 'image',
        likedBy: []
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
        college: 'IIT Delhi',
        likedBy: []
      }
    ];
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_posts`);
      return saved ? JSON.parse(saved) : defaultPosts;
    } catch {
      return defaultPosts;
    }
  });

  const [groups, setGroups] = useState<StudyGroup[]>(() => {
    const defaultGroups = [
      {
        id: '1',
        name: 'Physics S2 Study',
        members: 24,
        active: true,
        description: 'Discussing Quantum Mechanics and Thermodynamics.',
        messages: [
          { id: 'gm_1', sender: 'Aman Varma', text: 'Hey guys, did anyone solve the third question from assignment 2?', time: '10:30 AM' },
          { id: 'gm_2', sender: 'Priya Sharma', text: 'Yes, I got 5.4 eV for the energy level. Let me share the photo.', time: '10:32 AM' },
          { id: 'gm_3', sender: 'Neha Gupta', text: 'That matches my answer too. Thanks Priya!', time: '10:35 AM' }
        ]
      },
      {
        id: '2',
        name: 'DSA Interview Prep',
        members: 156,
        active: true,
        description: 'Cracking Big Tech interviews together.',
        messages: [
          { id: 'gm_4', sender: 'Sanya Malhotra', text: "Today's daily challenge is a classic Graph problem. Make sure to try it using BFS.", time: '09:15 AM' },
          { id: 'gm_5', sender: 'Karan Kapoor', text: 'Is it the "Shortest Path in Binary Matrix" one?', time: '09:18 AM' },
          { id: 'gm_6', sender: 'Sanya Malhotra', text: 'Yes! Focus on optimization and edge cases.', time: '09:20 AM' }
        ]
      },
      {
        id: '3',
        name: 'Semester 1 Seniors',
        members: 89,
        active: false,
        description: 'Advice and notes from your seniors.',
        messages: [
          { id: 'gm_7', sender: 'Vikas Hooda', text: 'Welcome to the group juniors! Feel free to ask about notes, labs or professors.', time: 'Yesterday' },
          { id: 'gm_8', sender: 'Rahul Sharma', text: 'Sessional 1 papers from last year are uploaded in the Storage tab, do check them out.', time: 'Yesterday' }
        ]
      }
    ];
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_groups`);
      return saved ? JSON.parse(saved) : defaultGroups;
    } catch {
      return defaultGroups;
    }
  });

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
  const [commentMedia, setCommentMedia] = useState<Record<string, {url: string, type: 'image' | 'video'} | null>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Marketplace Listings State
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() => {
    const defaultMarketplace: MarketplaceItem[] = [
      {
        id: 'm1',
        title: 'Introduction to Algorithms (CLRS) - 3rd Edition',
        type: 'book',
        purpose: 'sell',
        price: 450,
        condition: 'like-new',
        description: 'Used for one semester. Clean pages, no highlights. Includes solutions overview booklet.',
        author: 'Aman Varma',
        authorId: 'u1',
        college: 'IIT Delhi',
        timestamp: '2h ago',
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop',
        contactDetails: 'aman.varma@iitd.ac.in | 9876543210'
      },
      {
        id: 'm2',
        title: 'DSA Placement Prep Handwritten Notes',
        type: 'notes',
        purpose: 'donate',
        condition: 'good',
        description: 'Complete handwritten notes covering trees, graphs, DP and greedy algorithms with standard problems.',
        author: 'Sanya Malhotra',
        authorId: 'u3',
        college: 'BITS Pilani',
        timestamp: '5h ago',
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop',
        contactDetails: 'sanya.m@bits.edu'
      },
      {
        id: 'm3',
        title: 'Organic Chemistry (Morrison & Boyd)',
        type: 'book',
        purpose: 'exchange',
        exchangeFor: 'Concepts of Physics Vol 1 & 2 by HC Verma',
        condition: 'fair',
        description: 'Covers all JEE Advanced topics. Binding is a bit loose but all pages are intact and readable.',
        author: 'Rahul Sharma',
        authorId: 'u2',
        college: 'DTU',
        timestamp: '1d ago',
        imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=600&auto=format&fit=crop',
        contactDetails: 'rahul.dtu@gmail.com'
      },
      {
        id: 'm4',
        title: 'Discrete Mathematics Lecture Notes & Slide Packs',
        type: 'notes',
        purpose: 'sell',
        price: 150,
        condition: 'new',
        description: 'Printed and bound lecture notes for discrete structures course, including test papers.',
        author: 'Sanya Malhotra',
        authorId: 'u3',
        college: 'BITS Pilani',
        timestamp: '2d ago',
        imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop',
        contactDetails: 'sanya.m@bits.edu'
      }
    ];
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_marketplace`);
      return saved ? JSON.parse(saved) : defaultMarketplace;
    } catch {
      return defaultMarketplace;
    }
  });

  // Marketplace Filters & Search State
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketFilterCategory, setMarketFilterCategory] = useState<'all' | 'book' | 'notes' | 'other'>('all');
  const [marketFilterPurpose, setMarketFilterPurpose] = useState<'all' | 'sell' | 'exchange' | 'donate'>('all');

  // Marketplace Modals State
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: '',
    type: 'book' as 'book' | 'notes' | 'other',
    purpose: 'sell' as 'sell' | 'exchange' | 'donate',
    price: '',
    exchangeFor: '',
    condition: 'good' as 'new' | 'like-new' | 'good' | 'fair',
    description: '',
    contactDetails: '',
    imageUrl: ''
  });
  const [listingMediaFile, setListingMediaFile] = useState<string | null>(null);
  const listingFileInputRef = useRef<HTMLInputElement>(null);

  // Contact Seller State
  const [selectedContactItem, setSelectedContactItem] = useState<MarketplaceItem | null>(null);
  const [contactMessage, setContactMessage] = useState('');

  // Direct Messages State
  interface DirectMessage {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    time: string;
  }

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const defaultDMs: DirectMessage[] = [
      { id: 'dm1', senderId: 'u3', receiverId: 'current', text: 'Hey! Thanks for helping out with that Physics question.', time: '2h ago' },
      { id: 'dm2', senderId: 'current', receiverId: 'u3', text: 'Anytime Sanya! Glad I could help.', time: '1h ago' },
      { id: 'dm3', senderId: 'u1', receiverId: 'current', text: 'Hey, do you want to collaborate on the tech fest coding submission?', time: '1d ago' }
    ];
    try {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      const saved = localStorage.getItem(`unihub_${uid}_community_dms`);
      return saved ? JSON.parse(saved) : defaultDMs;
    } catch {
      return defaultDMs;
    }
  });

  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Peer Discovery Filter Search State
  const [peerSearchQuery, setPeerSearchQuery] = useState('');

  // Keep the 'current' user in communityUsers synchronized with changes in the profile prop
  React.useEffect(() => {
    if (profile) {
      setCommunityUsers(prev => ({
        ...prev,
        'current': {
          id: 'current',
          name: profile.name,
          college: profile.college,
          year: profile.year,
          points: prev['current']?.points ?? 450,
          bio: prev['current']?.bio ?? "Learning and growing every day! 🚀",
          avatarUrl: profile.avatarUrl
        }
      }));
    }
  }, [profile]);

  // Firestore Sync: Load all community data on mount
  React.useEffect(() => {
    const loadCommunityData = async () => {
      try {
        const loadedPosts = await fetchCommunityData('posts');
        if (loadedPosts) setPosts(loadedPosts);

        const loadedGroups = await fetchCommunityData('groups');
        if (loadedGroups) setGroups(loadedGroups);

        const loadedMarketplace = await fetchCommunityData('marketplace');
        if (loadedMarketplace) setMarketplaceItems(loadedMarketplace);

        const loadedDMs = await fetchCommunityData('dms');
        if (loadedDMs) setDirectMessages(loadedDMs);

        const loadedUsers = await fetchCommunityData('users');
        if (loadedUsers) setCommunityUsers(loadedUsers);

        // Load user-specific community settings (joined groups, friends)
        const uid = localStorage.getItem('unihub_active_user_id') || 'current';
        if (uid !== 'current') {
          const firestoreData = await fetchUserDataFromFirestore(uid);
          if (firestoreData) {
            if (firestoreData.joined_groups) {
              setJoinedGroupIds(new Set(firestoreData.joined_groups));
            }
            if (firestoreData.friends) {
              setFriendsList(new Set(firestoreData.friends));
            }
          }
        }
      } catch (err) {
        console.error("Error loading community data from Firestore:", err);
      } finally {
        isLoadedRef.current = true;
      }
    };

    loadCommunityData();
  }, []);

  // Firestore Sync: Save community data when states change
  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    saveCommunityData('posts', posts);
  }, [posts]);

  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    saveCommunityData('groups', groups);
  }, [groups]);

  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    saveCommunityData('marketplace', marketplaceItems);
  }, [marketplaceItems]);

  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    saveCommunityData('dms', directMessages);
  }, [directMessages]);

  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    saveCommunityData('users', communityUsers);
  }, [communityUsers]);

  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    const saveJoinedGroups = async () => {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      if (uid === 'current') return;
      try {
        const arr = Array.from(joinedGroupIds);
        localStorage.setItem(`unihub_${uid}_community_joined_groups`, JSON.stringify(arr));
        await saveUserDataToFirestore(uid, 'joined_groups', arr);
      } catch (e) { console.warn(e); }
    };
    saveJoinedGroups();
  }, [joinedGroupIds]);

  React.useEffect(() => {
    if (!isLoadedRef.current) return;
    const saveFriends = async () => {
      const uid = localStorage.getItem('unihub_active_user_id') || 'current';
      if (uid === 'current') return;
      try {
        const arr = Array.from(friendsList);
        localStorage.setItem(`unihub_${uid}_community_friends`, JSON.stringify(arr));
        await saveUserDataToFirestore(uid, 'friends', arr);
      } catch (e) { console.warn(e); }
    };
    saveFriends();
  }, [friendsList]);

  const showNotification = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleJoinGroup = (groupId: string) => {
    setJoinedGroupIds(prev => {
      const next = new Set(prev);
      if (!next.has(groupId)) {
        next.add(groupId);
        setGroups(curr => curr.map(g => g.id === groupId ? { ...g, members: g.members + 1 } : g));
        const groupName = groups.find(g => g.id === groupId)?.name || "Group";
        showNotification(`Successfully joined ${groupName}!`, "success");
      }
      return next;
    });
  };

  const handleLeaveGroup = (groupId: string) => {
    setJoinedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        setGroups(curr => curr.map(g => g.id === groupId ? { ...g, members: Math.max(0, g.members - 1) } : g));
        const groupName = groups.find(g => g.id === groupId)?.name || "Group";
        showNotification(`Left ${groupName}.`, "info");
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
        }
      }
      return next;
    });
  };

  const handleSendGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupMessageInput.trim() || !selectedGroupId) return;

    const newMessage: GroupMessage = {
      id: 'gmsg_' + Date.now().toString(),
      sender: profile?.name || 'Me',
      text: groupMessageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setGroups(curr => curr.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          messages: [...g.messages, newMessage]
        };
      }
      return g;
    }));
    
    setGroupMessageInput('');

    const uid = localStorage.getItem('unihub_active_user_id') || 'current';
    recordAcademicAction(uid, 'group_message');

    setTimeout(() => {
      const replies = [
        "That's a good point! Let me double check.",
        "Could you explain that part in more detail?",
        "I agree, let's schedule a study session for this.",
        "Thanks for sharing!",
        "Yes, let's work on this together tonight!"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const responders = ['Aman Varma', 'Rahul Sharma', 'Sanya Malhotra', 'Neha Gupta', 'Karan Kapoor', 'Priya Sharma', 'Vikas Hooda'];
      const randomResponder = responders[Math.floor(Math.random() * responders.length)];

      const simulatedResponse: GroupMessage = {
        id: 'gmsg_' + (Date.now() + 1).toString(),
        sender: randomResponder,
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setGroups(curr => curr.map(g => {
        if (g.id === selectedGroupId) {
          return {
            ...g,
            messages: [...g.messages, simulatedResponse]
          };
        }
        return g;
      }));
    }, 1500);
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
      mediaType: newPostMedia?.type,
      likedBy: []
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostMedia(null);
    showNotification("Buzz shared successfully!", "success");

    const uid = localStorage.getItem('unihub_active_user_id') || 'current';
    recordAcademicAction(uid, 'buzz_post');
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

    const uid = localStorage.getItem('unihub_active_user_id') || 'current';
    recordAcademicAction(uid, 'buzz_comment');
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

  const toggleLikePost = (postId: string) => {
    const currentUserId = 'current';
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id !== postId) return p;
      const hasLiked = p.likedBy?.includes(currentUserId) || false;
      const newLikedBy = hasLiked
        ? (p.likedBy || []).filter(id => id !== currentUserId)
        : [...(p.likedBy || []), currentUserId];
      const newLikesCount = hasLiked ? p.likes - 1 : p.likes + 1;
      return {
        ...p,
        likedBy: newLikedBy,
        likes: newLikesCount
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
    setActiveChatUserId(userId);
    setIsChatMinimized(false);
    showNotification(`Chat session started with ${communityUsers[userId]?.name || 'Student'}!`, "success");
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingForm.title.trim() || !listingForm.description.trim()) {
      showNotification("Please fill in the title and description.", "info");
      return;
    }

    if (listingForm.purpose === 'sell' && !listingForm.price.trim()) {
      showNotification("Please set a price for selling.", "info");
      return;
    }

    if (listingForm.purpose === 'exchange' && !listingForm.exchangeFor.trim()) {
      showNotification("Please specify the item you want to exchange for.", "info");
      return;
    }

    const newItem: MarketplaceItem = {
      id: 'm_' + Date.now().toString(),
      title: listingForm.title,
      type: listingForm.type,
      purpose: listingForm.purpose,
      price: listingForm.purpose === 'sell' ? parseFloat(listingForm.price) || 0 : undefined,
      exchangeFor: listingForm.purpose === 'exchange' ? listingForm.exchangeFor : undefined,
      condition: listingForm.condition,
      description: listingForm.description,
      author: profile?.name || 'Anonymous Student',
      authorId: 'current',
      college: profile?.college || 'University Hub',
      timestamp: 'Just now',
      imageUrl: listingMediaFile || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
      contactDetails: listingForm.contactDetails || profile?.classSection || 'Contact via Chat'
    };

    setMarketplaceItems([newItem, ...marketplaceItems]);
    setIsListingModalOpen(false);
    
    // Reset form
    setListingForm({
      title: '',
      type: 'book',
      purpose: 'sell',
      price: '',
      exchangeFor: '',
      condition: 'good',
      description: '',
      contactDetails: '',
      imageUrl: ''
    });
    setListingMediaFile(null);
    showNotification("Listing created successfully!", "success");

    // Award 20 points for contributing to the community!
    setCommunityUsers(prev => {
      const u = prev['current'];
      if (!u) return prev;
      return {
        ...prev,
        'current': { ...u, points: u.points + 20 }
      };
    });
    showNotification("Awarded 20 points for listing an academic resource!", "success");
  };

  const handleContactSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactItem) return;
    
    showNotification(`Message request sent to ${selectedContactItem.author}!`, "success");
    setSelectedContactItem(null);
    setContactMessage('');
  };

  const handleDeleteListing = (id: string) => {
    setMarketplaceItems(marketplaceItems.filter(item => item.id !== id));
    showNotification("Listing removed successfully.", "info");
  };

  const autoReplyTemplates: Record<string, string> = {
    'Sanya Malhotra': "Awesome! I'll share the placement prep resource link with you in a second.",
    'Aman Varma': "Sure, let's catch up in the library during lunch to discuss Maxwell equations.",
    'Rahul Sharma': "Thanks! I'll check my schedule and let you know if we can meet up.",
    'Karan Kapoor': "Hey classmate! Let's start working on the project submission tonight.",
    'Priya Sharma': "Perfect! I'll get the study guide ready."
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUserId) return;

    const newMessage: DirectMessage = {
      id: 'dm_' + Date.now().toString(),
      senderId: 'current',
      receiverId: activeChatUserId,
      text: chatInput,
      time: 'Just now'
    };

    setDirectMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Trigger mock auto-reply after 1.5 seconds
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const partner = communityUsers[activeChatUserId];
      const replies = [
        `Hey there! That sounds awesome, let's catch up later to discuss.`,
        `Sure! Thanks for reaching out. I'll get back to you shortly.`,
        `Got it! Let me review the notes and text you back.`,
        `Hey! I'm in class right now, will ping you in an hour. 👍`,
        `Thanks for the message! Let's work on this together.`
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const autoReply: DirectMessage = {
        id: 'dm_' + (Date.now() + 1).toString(),
        senderId: activeChatUserId,
        receiverId: 'current',
        text: autoReplyTemplates[partner?.name] || randomReply,
        time: 'Just now'
      };

      setDirectMessages(prev => [...prev, autoReply]);
    }, 1500);
  };

  const filteredMarketItems = marketplaceItems.filter(item => {
    const query = marketSearchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) || 
      (item.exchangeFor && item.exchangeFor.toLowerCase().includes(query)) ||
      item.author.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query);

    const matchesCategory = marketFilterCategory === 'all' || item.type === marketFilterCategory;
    const matchesPurpose = marketFilterPurpose === 'all' || item.purpose === marketFilterPurpose;

    return matchesSearch && matchesCategory && matchesPurpose;
  });

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
          {(['feed', 'groups', 'marketplace', 'discover'] as const).map((tab) => (
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
                    <button type="button" onClick={(e) => openProfile(e, 'current')} className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold">{profile?.name?.charAt(0) || 'U'}</span>
                      )}
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
                            {author.avatarUrl ? (
                              <img src={author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              post.author.charAt(0)
                            )}
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
                        <button 
                          onClick={() => toggleLikePost(post.id)} 
                          className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                            post.likedBy?.includes('current') 
                              ? 'text-rose-500 hover:text-rose-600' 
                              : 'text-slate-400 hover:text-rose-500'
                          }`}
                        >
                          <i className={`${post.likedBy?.includes('current') ? 'fa-solid fa-heart animate-pulse' : 'fa-regular fa-heart'}`}></i> 
                          {post.likes}
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
                                  {cAuthor.avatarUrl ? (
                                    <img src={cAuthor.avatarUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    c.author.charAt(0)
                                  )}
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

          {activeTab === 'groups' && selectedGroupId ? (() => {
            const group = groups.find(g => g.id === selectedGroupId);
            if (!group) return null;
            return (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[550px] animate-in fade-in duration-300">
                {/* Chat Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedGroupId(null)}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center shadow-sm"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">{group.name}</h3>
                        {group.active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-0.5">{group.members} Members • {group.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleLeaveGroup(group.id)}
                    className="px-3 py-1.5 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Leave Group
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 dark:bg-slate-950/10 custom-scrollbar flex flex-col">
                  {group.messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl text-slate-400 dark:text-slate-500 mb-3">
                        <i className="fa-solid fa-comments"></i>
                      </div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">No messages yet</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mt-1">Start the conversation by sending a message below!</p>
                    </div>
                  ) : (
                    group.messages.map((msg) => {
                      const isMe = msg.isMe || msg.sender === (profile?.name || 'Me');
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2.5 items-start`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center overflow-hidden flex-shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                              {msg.sender.charAt(0)}
                            </div>
                          )}
                          <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                            {!isMe && <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 ml-1">{msg.sender}</span>}
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-tr-none text-left shadow-md shadow-indigo-100/50 dark:shadow-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm text-left'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] mt-1 block opacity-60 text-slate-400 font-bold uppercase tracking-wider px-1">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendGroupMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message to the group..." 
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white border border-transparent"
                    value={groupMessageInput}
                    onChange={(e) => setGroupMessageInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!groupMessageInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Send</span>
                    <i className="fa-solid fa-paper-plane text-[9px]"></i>
                  </button>
                </form>
              </div>
            );
          })() : null}

          {activeTab === 'groups' && !selectedGroupId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {groups.map((group) => {
                const isJoined = joinedGroupIds.has(group.id);
                return (
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
                    {isJoined ? (
                      <div className="flex gap-2 mt-6">
                        <button 
                          onClick={() => setSelectedGroupId(group.id)}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                        >
                          Enter Chat
                        </button>
                        <button 
                          onClick={() => handleLeaveGroup(group.id)}
                          className="py-3 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Leave
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleJoinGroup(group.id)}
                        className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                      >
                        Join Group
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input 
                    type="text" 
                    placeholder="Search books, notes, subjects..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white border border-transparent focus:border-indigo-500/50"
                    value={marketSearchQuery}
                    onChange={(e) => setMarketSearchQuery(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={() => setIsListingModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 duration-200"
                >
                  <i className="fa-solid fa-plus"></i> List an Item
                </button>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-2">Category:</span>
                  {(['all', 'book', 'notes', 'other'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMarketFilterCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${
                        marketFilterCategory === cat
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-2">Purpose:</span>
                  {(['all', 'sell', 'exchange', 'donate'] as const).map((purp) => (
                    <button
                      key={purp}
                      onClick={() => setMarketFilterPurpose(purp)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${
                        marketFilterPurpose === purp
                          ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {purp === 'all' ? 'all' : purp === 'sell' ? 'buy/sell' : purp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marketplace Item Grid */}
              {filteredMarketItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMarketItems.map((item) => {
                    const isOwner = item.authorId === 'current';
                    return (
                      <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                        {/* Product Cover Image Container */}
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-800 dark:to-indigo-950 flex flex-col items-center justify-center text-indigo-400 dark:text-indigo-600">
                              <i className={`fa-solid ${
                                item.type === 'book' ? 'fa-book' : item.type === 'notes' ? 'fa-note-sticky' : 'fa-shapes'
                              } text-5xl mb-2`}></i>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{item.type}</span>
                            </div>
                          )}
                          
                          {/* Floating Badge (Sell/Exchange/Donate) */}
                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-md ${
                              item.purpose === 'sell' ? 'bg-indigo-600' : item.purpose === 'exchange' ? 'bg-emerald-600' : 'bg-rose-500'
                            }`}>
                              {item.purpose === 'sell' ? 'for sale' : item.purpose === 'exchange' ? 'exchange' : 'free/donate'}
                            </span>
                          </div>

                          {/* Floating Condition Badge */}
                          <div className="absolute top-4 right-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm ${
                              item.condition === 'new' ? 'text-green-600 dark:text-green-400' :
                              item.condition === 'like-new' ? 'text-blue-600 dark:text-blue-400' :
                              item.condition === 'good' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {item.condition === 'like-new' ? 'like new' : item.condition}
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>{item.type}</span>
                              <span>•</span>
                              <span>{item.timestamp}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{item.description}</p>
                          </div>

                          {/* Deal Details & Seller Info */}
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div>
                              {item.purpose === 'sell' && (
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-[10px] font-bold text-slate-400">₹</span>
                                  <span className="text-lg font-black text-slate-800 dark:text-white">{item.price}</span>
                                </div>
                              )}
                              {item.purpose === 'exchange' && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="font-black text-[8px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">Exchanges for:</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{item.exchangeFor}</span>
                                </div>
                              )}
                              {item.purpose === 'donate' && (
                                <span className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <i className="fa-solid fa-gift"></i> FREE / GIFT
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1 max-w-[55%] truncate">
                                <i className="fa-solid fa-building-columns flex-shrink-0"></i> {item.college}
                              </span>
                              <span onClick={(e) => openProfile(e, item.authorId)} className="cursor-pointer hover:underline flex items-center gap-1 text-indigo-500 dark:text-indigo-400 max-w-[40%] truncate">
                                <i className="fa-solid fa-user flex-shrink-0"></i> {isOwner ? 'Me' : item.author}
                              </span>
                            </div>
                          </div>

                          {/* CTA Action Buttons */}
                          <div className="mt-4">
                            {isOwner ? (
                              <button 
                                onClick={() => handleDeleteListing(item.id)}
                                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-900/30"
                              >
                                <i className="fa-solid fa-trash-can"></i> Remove Listing
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedContactItem(item);
                                  setContactMessage(`Hi ${item.author}, I am interested in your listing: "${item.title}". Is it still available?`);
                                }}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                              >
                                <i className="fa-solid fa-paper-plane"></i> 
                                {item.purpose === 'sell' ? 'Contact Seller' : item.purpose === 'exchange' ? 'Request Exchange' : 'Claim Item'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl text-slate-400 dark:text-slate-500 mx-auto mb-4">
                    <i className="fa-solid fa-book-open-reader"></i>
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">No items found matching your filters</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">Be the first to list a textbook or lecture notes in this category!</p>
                  <button 
                    onClick={() => setIsListingModalOpen(true)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    List an Item Now
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && (() => {
            const userCollege = (profile?.college || 'PIET').trim();
            const userYear = profile?.year || '1st Year';
            const userSection = (profile?.classSection || '').trim();

            const allPeers = (Object.values(communityUsers) as CommunityUser[]).filter(u => u.id !== 'current');

            // Classmates: Same college, same year, same section
            const classmates = allPeers.filter(u => 
              u.college.toLowerCase().trim() === userCollege.toLowerCase() && 
              u.year === userYear && 
              (u.classSection || '').toLowerCase().trim() === userSection.toLowerCase()
            );

            // College Peers: Same college, but different section or year
            const collegePeers = allPeers.filter(u => 
              u.college.toLowerCase().trim() === userCollege.toLowerCase() && 
              !(u.year === userYear && (u.classSection || '').toLowerCase().trim() === userSection.toLowerCase())
            );

            // Other College peers
            const otherPeers = allPeers.filter(u => 
              u.college.toLowerCase().trim() !== userCollege.toLowerCase()
            );

            const searchFilter = (u: CommunityUser) => {
              const q = peerSearchQuery.toLowerCase().trim();
              return !q || u.name.toLowerCase().includes(q) || (u.bio || '').toLowerCase().includes(q);
            };

            const filteredClassmates = classmates.filter(searchFilter);
            const filteredCollegePeers = collegePeers.filter(searchFilter);
            const filteredOtherPeers = otherPeers.filter(searchFilter);

            const renderUserCard = (user: CommunityUser) => {
              const isFriend = friendsList.has(user.id);
              const level = getLevel(user.points);
              return (
                <div key={user.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-100 dark:border-indigo-900/30 overflow-hidden flex-shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 onClick={(e) => openProfile(e, user.id)} className="font-bold text-slate-800 dark:text-white text-sm hover:text-indigo-600 cursor-pointer">{user.name}</h4>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${level.color} mt-1 inline-flex items-center gap-1`}>
                            <i className={`fa-solid ${level.icon}`}></i> {level.name}
                          </span>
                        </div>
                      </div>
                      {user.college.toLowerCase().trim() === userCollege.toLowerCase() && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-955/30 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded border border-indigo-100 dark:border-indigo-900/50">
                          {user.year}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic mb-4">"{user.bio || 'No bio yet.'}"</p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1 truncate"><i className="fa-solid fa-building-columns flex-shrink-0"></i> {user.college}</span>
                      {user.classSection && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><i className="fa-solid fa-layer-group flex-shrink-0"></i> {user.classSection}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1"><i className="fa-solid fa-star"></i> {user.points} pts</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isFriend ? (
                      <>
                        <span className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1">
                          <i className="fa-solid fa-user-check"></i> Friends
                        </span>
                        <button 
                          onClick={() => {
                            setActiveChatUserId(user.id);
                            setIsChatMinimized(false);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                        >
                          <i className="fa-solid fa-paper-plane text-[9px]"></i> Msg
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => toggleFriend(user.id)}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-955/30 dark:hover:bg-indigo-955/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-user-plus"></i> Add Friend
                      </button>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Search Box */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input 
                      type="text" 
                      placeholder="Search batchmates, college peers by name or bio..." 
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white border border-transparent focus:border-indigo-500/50"
                      value={peerSearchQuery}
                      onChange={(e) => setPeerSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 1: My Classmates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-500 animate-pulse"></span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      My Classmates ({profile?.college || 'PIET'} - {profile?.classSection || 'No Class'})
                    </h3>
                  </div>
                  {filteredClassmates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredClassmates.map(renderUserCard)}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-450 dark:text-slate-550 italic bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                      No classmates found in {profile?.classSection || 'your section'}.
                    </p>
                  )}
                </div>

                {/* Section 2: College Peers */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded bg-violet-500"></span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      College Peers ({profile?.college || 'PIET'})
                    </h3>
                  </div>
                  {filteredCollegePeers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredCollegePeers.map(renderUserCard)}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-450 dark:text-slate-550 italic bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                      No other peers found at {profile?.college || 'your college'}.
                    </p>
                  )}
                </div>

                {/* Section 3: Other Universities */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Other Universities
                    </h3>
                  </div>
                  {filteredOtherPeers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredOtherPeers.map(renderUserCard)}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-450 dark:text-slate-550 italic bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                      No peers found from other colleges.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* User Reputation Card */}
          <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={(e) => openProfile(e, 'current')} className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black border border-white/30 overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0) || 'U'
                  )}
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
                <div 
                  key={fid} 
                  onClick={() => {
                    setActiveChatUserId(fid);
                    setIsChatMinimized(false);
                  }}
                  className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all animate-in fade-in"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-black overflow-hidden flex-shrink-0">
                      {communityUsers[fid]?.avatarUrl ? (
                        <img src={communityUsers[fid].avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        communityUsers[fid]?.name.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{communityUsers[fid]?.name || 'Friend'}</p>
                      <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openProfile(e, fid);
                      }}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center text-[10px]"
                    >
                      <i className="fa-solid fa-user text-[8px]"></i>
                    </button>
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
                  {viewedUser.avatarUrl ? (
                    <img src={viewedUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    viewedUser.name.charAt(0)
                  )}
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

      {/* List Item Modal */}
      {isListingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">List Academic Resource</h3>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Sell, exchange or donate to your peers</p>
              </div>
              <button 
                onClick={() => {
                  setIsListingModalOpen(false);
                  setListingMediaFile(null);
                }} 
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateListing} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Image upload widget */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Item Image</span>
                <div 
                  onClick={() => listingFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/35 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-colors h-36 relative overflow-hidden"
                >
                  {listingMediaFile ? (
                    <>
                      <img src={listingMediaFile} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setListingMediaFile(null);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md z-10"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-400 dark:text-slate-500 mb-2"></i>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Click to upload photo</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={listingFileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setListingMediaFile(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Item Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., CLRS Introduction to Algorithms Third Edition"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                />
              </div>

              {/* Type and Condition Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Type *</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                    value={listingForm.type}
                    onChange={(e) => setListingForm({ ...listingForm, type: e.target.value as any })}
                  >
                    <option value="book">Book</option>
                    <option value="notes">Notes</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Condition *</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                    value={listingForm.condition}
                    onChange={(e) => setListingForm({ ...listingForm, condition: e.target.value as any })}
                  >
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair / Worn</option>
                  </select>
                </div>
              </div>

              {/* Purpose Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Listing Option *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sell', 'exchange', 'donate'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setListingForm({ ...listingForm, purpose: mode })}
                      className={`py-3 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                        listingForm.purpose === mode
                          ? mode === 'sell' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' :
                            mode === 'exchange' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' :
                            'bg-rose-500 text-white border-rose-500 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {mode === 'sell' ? 'Sell' : mode === 'exchange' ? 'Exchange' : 'Donate / Free'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs based on Purpose */}
              {listingForm.purpose === 'sell' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Price (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      required
                      placeholder="e.g., 250"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white font-mono"
                      value={listingForm.price}
                      onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {listingForm.purpose === 'exchange' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Exchange for item *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., HC Verma Physics Volume 1"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                    value={listingForm.exchangeFor}
                    onChange={(e) => setListingForm({ ...listingForm, exchangeFor: e.target.value })}
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Item Details / Description *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe the condition, highlights, notes completeness, or syllabus coverage..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white resize-none"
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Contact Details (optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., email@domain.com or Phone number"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  value={listingForm.contactDetails}
                  onChange={(e) => setListingForm({ ...listingForm, contactDetails: e.target.value })}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsListingModalOpen(false);
                    setListingMediaFile(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
                >
                  Post Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      {selectedContactItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  {selectedContactItem.purpose === 'sell' ? 'Contact Seller' : selectedContactItem.purpose === 'exchange' ? 'Request Exchange' : 'Claim Item'}
                </h3>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Listing Owner: {selectedContactItem.author}</p>
              </div>
              <button 
                onClick={() => setSelectedContactItem(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleContactSeller} className="p-6 space-y-4">
              {/* Product Info Summary */}
              <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedContactItem.imageUrl ? (
                  <img src={selectedContactItem.imageUrl} alt={selectedContactItem.title} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-500">
                    <i className="fa-solid fa-book"></i>
                  </div>
                )}
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{selectedContactItem.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {selectedContactItem.purpose === 'sell' ? `Price: ₹${selectedContactItem.price}` :
                     selectedContactItem.purpose === 'exchange' ? `Exchanging for: ${selectedContactItem.exchangeFor}` : 'Gift / Free'}
                  </p>
                </div>
              </div>

              {/* Chat Message Text */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Your Message</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white resize-none"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
              </div>

              {/* Seller Contact Info details */}
              {selectedContactItem.contactDetails && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <span className="text-[8px] font-black uppercase text-amber-600 dark:text-amber-500 block mb-1">Direct Contact info:</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-bold font-mono">{selectedContactItem.contactDetails}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedContactItem(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Direct Message Box */}
      {activeChatUserId && communityUsers[activeChatUserId] && (
        <div className={`fixed bottom-6 right-6 z-[100] w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 ${
          isChatMinimized ? 'h-14' : 'h-[26rem]'
        }`}>
          {/* Chat Header */}
          <div 
            onClick={() => setIsChatMinimized(!isChatMinimized)}
            className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 text-[10px] font-black flex items-center justify-center text-white">
                {communityUsers[activeChatUserId].avatarUrl ? (
                  <img src={communityUsers[activeChatUserId].avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  communityUsers[activeChatUserId].name.charAt(0)
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold truncate leading-tight">{communityUsers[activeChatUserId].name}</h4>
                <p className="text-[7px] font-bold uppercase tracking-wider opacity-85 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setIsChatMinimized(!isChatMinimized)} 
                className="hover:opacity-80 transition-opacity text-white text-xs"
              >
                <i className={`fa-solid ${isChatMinimized ? 'fa-window-restore' : 'fa-minus'}`}></i>
              </button>
              <button 
                onClick={() => setActiveChatUserId(null)} 
                className="hover:opacity-80 transition-opacity text-white text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          {!isChatMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar flex flex-col">
                {/* Pre-filtered messages for this specific conversation */}
                {directMessages
                  .filter(msg => 
                    (msg.senderId === 'current' && msg.receiverId === activeChatUserId) ||
                    (msg.senderId === activeChatUserId && msg.receiverId === 'current')
                  )
                  .map(msg => {
                    const isMe = msg.senderId === 'current';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm'
                        }`}>
                          <p>{msg.text}</p>
                          <span className="text-[7px] mt-1 block opacity-60 text-right">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })}
                
                {/* Typing simulator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-2 px-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex gap-1 items-center">
                      <div className="w-1 h-1 bg-indigo-450 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1 h-1 bg-indigo-450 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Footer */}
              <form onSubmit={handleSendDirectMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white border border-transparent"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-8 h-8 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <i className="fa-solid fa-paper-plane text-[10px]"></i>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Community;
