import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Eye, Heart, MessageSquare, BookOpen, Lock, Compass, Sparkles, 
  ChevronLeft, Calendar, Share2, CornerDownRight, SlidersHorizontal, 
  Send, User, Terminal, CheckCircle2, RefreshCw, X
} from "lucide-react";
import { PortfolioItem, Comment, SEOConfiguration } from "./types";
import ImageLoader from "./components/ImageLoader";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Navigation & Public States
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("全體創作");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  
  // Floating comment form state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Like feedback state
  const [likedList, setLikedList] = useState<string[]>([]);
  const [showHeartParticle, setShowHeartParticle] = useState(false);

  // Authentication & Admin States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdminOpened, setIsAdminOpened] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string>("");
  const [userRole, setUserRole] = useState<'admin' | 'editor' | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin sub-views
  const [adminSubTab, setAdminSubTab] = useState<'stats' | 'manage'>('stats');

  // Load SEO config
  const [seo, setSeo] = useState<SEOConfiguration | null>(null);

  // Fetch public items
  const fetchPublicItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Error loading portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SEO config
  const fetchSEOConfig = async () => {
    try {
      const res = await fetch("/api/seo");
      if (res.ok) {
        const data = await res.json();
        setSeo(data);
        // Apply to actual tab title for real browser layout (SEO optimization!)
        document.title = data.title;
      }
    } catch (err) {
      console.error("Error fetching SEO:", err);
    }
  };

  // Trigger when selecting detail item
  const fetchItemDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolio/${id}`);
      if (res.ok) {
        const fullItem = await res.json();
        setSelectedItem(fullItem);
        // Also fetch comments
        const commentsRes = await fetch(`/api/portfolio/${id}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData);
        }
      }
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
  };

  useEffect(() => {
    fetchPublicItems();
    fetchSEOConfig();
    
    // Check local storage for persistent administrative token if applicable
    const savedToken = localStorage.getItem("salon_admin_token");
    const savedRole = localStorage.getItem("salon_admin_role");
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole as 'admin' | 'editor');
    }
  }, []);

  // Handle category change
  const categories = ["全體創作", "膠片攝影", "文學創作", "視覺設計", "生活哲學"];
  const filteredItems = selectedCategory === "全體創作" 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  // Handle client like press
  const handleLikeItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedList.includes(itemId)) return; // Already liked in this session

    try {
      const res = await fetch(`/api/portfolio/${itemId}/like`, { method: "POST" });
      if (res.ok) {
        setLikedList(prev => [...prev, itemId]);
        // Update local counts in public grid list
        setItems(prevItems => 
          prevItems.map(item => item.id === itemId ? { ...item, likes: item.likes + 1 } : item)
        );
        // Update selected detail overlay state
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        }
        
        // Trigger lovely floating heart particle
        setShowHeartParticle(true);
        setTimeout(() => setShowHeartParticle(false), 1200);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newCommentAuthor.trim() || !newCommentContent.trim()) return;

    try {
      setCommentSubmitting(true);
      const res = await fetch(`/api/portfolio/${selectedItem.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: newCommentAuthor.trim(),
          content: newCommentContent.trim()
        })
      });

      if (res.ok) {
        const addedComment = await res.json();
        // Update local comment feeds
        setComments(prev => [...prev, addedComment]);
        // Reset inputs
        setNewCommentAuthor("");
        setNewCommentContent("");
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);

        // Update comment counter in detail & parent items list
        setSelectedItem(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        setItems(prev => prev.map(item => item.id === selectedItem.id ? { ...item, commentsCount: item.commentsCount + 1 } : item));
      }
    } catch (err) {
      console.error("Comment submission failure:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle Login Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "存取失敗");
      }

      // Success
      setToken(data.token);
      setUserRole(data.user.role);
      localStorage.setItem("salon_admin_token", data.token);
      localStorage.setItem("salon_admin_role", data.user.role);
      
      setShowLoginModal(false);
      setIsAdminOpened(true); // Open admin backoffice instantly
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setLoginError(err.message || "登入時發生異常");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUserRole(null);
    localStorage.removeItem("salon_admin_token");
    localStorage.removeItem("salon_admin_role");
    setIsAdminOpened(false);
  };

  // Copy share info
  const handleShare = (item: PortfolioItem) => {
    const textToCopy = `※ 微光選讀《${item.title}》 ｜ 分類：${item.category}。點擊連結在漫步中閱讀：\n${window.location.origin}`;
    navigator.clipboard.writeText(textToCopy);
    alert("已複製分享文青推文至您的剪貼簿！✨");
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2C2C2C] selection:bg-[#7D8471] selection:text-white flex flex-col justify-between font-sans">
      
      {/* BACKGROUND GRAPHIC ACCENTS (HUMBLE DESIGN INTEGRITY) */}
      <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#7D8471] via-[#E5E4DE] to-[#F9F8F6]" />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        
        {/* PUBLIC LOGO HEADER */}
        <header className="text-center mb-10 sm:mb-16 space-y-4 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-[#F4F3EE] border border-[#E5E4DE] px-4 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#7D8471]" />
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#7D8471]/80">
              詩意與視覺的對立間隙
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-serif italic font-bold tracking-tight text-[#2C2C2C] mt-3">
            微光沙龍空間
          </h1>

          <p className="font-serif text-xs sm:text-sm text-[#2C2C2C] opacity-70 italic max-w-lg mx-auto leading-relaxed">
            「時間在膠片中折疊，我們在文字的筆觸與色彩的空隙間行進。」
          </p>

          <p className="font-mono text-[10px] text-[#2C2C2C]/50">
            {seo?.author || "Horizon / 塵世水平線"} ∙ 理性與美學的日常紀錄
          </p>
        </header>

        {/* ADMIN MODE SWITCH BAR (IF LOGGED IN) */}
        {token && (
          <div className="mb-8 p-3.5 bg-[#F4F3EE] rounded-lg border border-[#E5E4DE] flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="font-serif font-bold text-[#7D8471]">【沙龍管家已就位】以 {userRole === 'admin' ? "管理者 admin" : "編輯 editor"} 簽到</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAdminOpened(!isAdminOpened)}
                className="px-3.5 py-1.5 bg-[#2C2C2C] hover:bg-[#7D8471] text-white text-xs font-serif tracking-wider transition-all rounded"
              >
                {isAdminOpened ? "返回沙龍外網" : "跨入管理後台"}
              </button>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-white border border-[#E5E4DE] text-rose-800 text-xs font-serif transition-all hover:bg-rose-50 rounded"
              >
                安全登出
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY WRAPPER: SWITCH BETWEEN MAIN PAGE & ADMIN PANEL */}
        <AnimatePresence mode="wait">
          {isAdminOpened && token ? (
            
            // ==================== ADMINISTRATIVE BACK OFFICE VIEW ====================
            <motion.div
              key="admin-desktop"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
              id="salon-backoffice"
            >
              <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3">
                <div className="flex items-center space-x-1">
                  <Terminal className="w-5 h-5 text-[#7D8471]" />
                  <h2 className="font-serif text-lg font-bold text-[#2C2C2C]">沙龍內部大廳 ∙ 後門調控板</h2>
                </div>
                
                {/* Admin Mode Toggles */}
                <div className="flex items-center space-x-1.5 bg-[#F4F3EE] p-1 rounded border border-[#E5E4DE]">
                  <button
                    onClick={() => setAdminSubTab('stats')}
                    className={`px-3 py-1 text-xs font-serif transition-all ${
                      adminSubTab === 'stats' ? "bg-white text-[#2C2C2C] shadow-sm font-semibold" : "text-[#2C2C2C]/60 hover:text-[#2C2C2C]"
                    }`}
                  >
                    漫讀數據情報
                  </button>
                  <button
                    onClick={() => setAdminSubTab('manage')}
                    className={`px-3 py-1 text-xs font-serif transition-all ${
                      adminSubTab === 'manage' ? "bg-white text-[#2C2C2C] shadow-sm font-semibold" : "text-[#2C2C2C]/60 hover:text-[#2C2C2C]"
                    }`}
                  >
                    作品與留言編修
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Analytical Dashboard */}
              {adminSubTab === 'stats' && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#7D8471] text-white rounded-lg">
                    <h3 className="font-serif font-bold text-sm">數據沙龍 ｜ 日誌大廳</h3>
                    <p className="text-[11px] opacity-90 mt-1">
                      此處匯聚訪客在主網頁點擊、喜愛、寫下評論的實時資訊，支援多維度管道歸因與造訪載具光譜追蹤。
                    </p>
                  </div>
                  <Dashboard token={token} role={userRole || 'editor'} />
                </div>
              )}

              {/* Sub-tab 2: Complete CRUD Control */}
              {adminSubTab === 'manage' && (
                <AdminPanel 
                  token={token} 
                  role={userRole || 'editor'} 
                  onLogout={handleLogout} 
                  onRefreshPublic={fetchPublicItems}
                />
              )}

            </motion.div>
          ) : (
            
            // ==================== VISITOR USER-FACING HOME VIEW ====================
            <motion.div
              key="visitor-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              
              {/* Category selector / Filter header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E5E4DE] pb-4">
                <div className="flex items-center space-x-1.5 text-[#2C2C2C]/60">
                  <SlidersHorizontal className="w-4 h-4 text-[#7D8471]" />
                  <span className="font-serif text-xs font-medium">漫步選集分架</span>
                </div>

                <div className="flex flex-wrap gap-1 items-center justify-center">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-serif transition-all ${
                        selectedCategory === cat 
                          ? "bg-[#7D8471] text-white rounded-lg font-bold" 
                          : "text-[#2C2C2C]/70 hover:bg-[#F4F3EE] hover:text-[#2C2C2C] rounded-lg"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loader */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#7D8471] border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-serif text-[#2C2C2C]/55 italic mt-4 text-xs">正在渲染沙龍景深...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-[#F4F3EE]/50 border border-[#E5E4DE] rounded-3xl p-8">
                  <BookOpen className="w-8 h-8 text-[#7D8471] mx-auto opacity-50 mb-3" />
                  <p className="font-serif text-xs text-[#2C2C2C]/60 italic">此分架目前靜置中，隨筆正在醞釀。</p>
                </div>
              ) : (
                /* PORTFOLIO ASYMMETRICAL EDITORIAL GRID (Wabi-Sabi Flow) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredItems.map((item, index) => {
                    const isLiked = likedList.includes(item.id);
                    // Beautiful custom arrangement variations
                    const isSpanBlock = index % 5 === 0 && index !== 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => fetchItemDetails(item.id)}
                        className={`group cursor-pointer bg-white border border-[#E5E4DE] hover:border-[#7D8471]/60 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${
                          isSpanBlock ? "md:col-span-2 lg:col-span-1" : ""
                        }`}
                      >
                        <div>
                          {/* Rich Progressive Image with skeletal feedback */}
                          <div className="h-48 sm:h-52 w-full">
                            <ImageLoader 
                              src={item.imageUrl} 
                              alt={item.title} 
                              containerClassName="h-full w-full"
                              className="group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                          </div>

                          {/* Content Details */}
                          <div className="p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between text-[10px] tracking-wider text-[#2C2C2C]/50 font-mono">
                              <span className="font-serif px-1.5 py-0.5 bg-[#F4F3EE] border border-[#E5E4DE] text-[#7D8471] rounded">
                                {item.category}
                              </span>
                              <span>{item.date}</span>
                            </div>

                            <h3 className="font-serif text-base font-bold text-[#2C2C2C] tracking-tight group-hover:text-[#7D8471] transition-colors leading-snug">
                              {item.title}
                            </h3>

                            <p className="text-[11px] leading-relaxed text-[#2C2C2C]/80 line-clamp-3 font-serif">
                              {item.summary}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Metrics Bar */}
                        <div className="px-4 py-3 bg-[#F4F3EE]/40 border-t border-[#E5E4DE] flex justify-between items-center text-[10px] font-mono text-[#2C2C2C]/60">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3.5 h-3.5 opacity-70" />
                              <span>{item.views} 閱</span>
                            </span>
                            <span className="flex items-center space-x-1 text-[#7D8471]">
                              <MessageSquare className="w-3.5 h-3.5 opacity-70" />
                              <span>{item.commentsCount} 回</span>
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleLikeItem(item.id, e)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                              isLiked 
                                ? "text-rose-700 bg-rose-50" 
                                : "hover:text-[#7D8471] hover:bg-[#F4F3EE]/60"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-700 text-rose-700" : "opacity-70"}`} />
                            <span>{item.likes} {isLiked ? "已讚" : "點讚"}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ==================== SEAMLESS SIDE READING DRAWER OVERLAY ==================== */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            
            {/* Backdrop lock */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-[#2C2C2C]"
            />

            {/* Reading Drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="relative w-full max-w-2xl h-full bg-[#F9F8F6] shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                
                {/* Floating controls */}
                <div className="sticky top-0 bg-[#F9F8F6]/90 backdrop-blur border-b border-[#E5E4DE] p-4 flex items-center justify-between z-10">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex items-center space-x-1 text-xs font-serif text-[#2C2C2C]/60 hover:text-[#2C2C2C] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>關閉並返回沙龍</span>
                  </button>

                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => handleShare(selectedItem)}
                      className="p-1.5 border border-[#E5E4DE] text-[#2C2C2C]/70 hover:text-[#2C2C2C] hover:bg-white transition-all rounded"
                      title="分享本篇隨筆"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-1 px-2 border border-gray-300 text-gray-500 hover:text-black rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Hero image header */}
                <div className="h-64 sm:h-80 w-full relative">
                  <ImageLoader src={selectedItem.imageUrl} alt={selectedItem.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F9F8F6] via-[#F9F8F6]/30 to-transparent" />
                </div>

                {/* Article Prose content body */}
                <div className="px-5 sm:px-8 pb-8 -mt-10 relative">
                  <div className="space-y-4">
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#2C2C2C]/60">
                      <span className="font-serif px-2 py-0.5 bg-[#F4F3EE] border border-[#E5E4DE] text-[#7D8471] rounded-full">
                        {selectedItem.category}
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{selectedItem.date}</span>
                      </span>
                      <span>∙</span>
                      <span>👀 {selectedItem.views} 次閱讀</span>
                    </div>

                    <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#2C2C2C] leading-snug">
                      {selectedItem.title}
                    </h2>

                    {/* Tags list */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedItem.tags?.map(tag => (
                        <span key={tag} className="text-[10px] font-mono bg-[#F4F3EE] text-[#2C2C2C]/70 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Prose Content */}
                    <div className="pt-6 font-serif text-sm text-[#2C2C2C] leading-relaxed tracking-wider border-t border-[#E5E4DE] space-y-5 whitespace-pre-line">
                      {selectedItem.content}
                    </div>

                  </div>

                  {/* Active interaction box */}
                  <div className="mt-8 p-5 bg-[#F4F3EE] border border-[#E5E4DE] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="font-serif text-xs font-bold text-[#2C2C2C]">看完此隨筆作品，深感共鳴？</h4>
                      <p className="text-[10px] text-[#2C2C2C]/60 mt-1 font-mono">點擊按鈕累積溫度，或在下方留下您的印記。</p>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => handleLikeItem(selectedItem.id, e)}
                        className={`flex items-center space-x-1.5 px-4 py-2 rounded-full font-serif text-xs transition-all ${
                          likedList.includes(selectedItem.id)
                            ? "bg-[#7D8471] text-white px-5"
                            : "bg-[#2C2C2C] hover:bg-[#7D8471] text-white"
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current text-white" />
                        <span className="font-semibold">溫柔奉讚 ∙ {selectedItem.likes} 支持</span>
                      </button>

                      {/* Spark Heart Floating Animation */}
                      <AnimatePresence>
                        {showHeartParticle && (
                          <motion.span
                            initial={{ opacity: 0, y: 0, scale: 0.5 }}
                            animate={{ opacity: 1, y: -40, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 -ml-3 text-rose-600 pointer-events-none text-xl"
                          >
                            ❤️
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ================= COMMENTS INTEGRATED DISCOVERY ================= */}
                  <div className="mt-10 border-t border-[#E5E4DE] pt-8 space-y-6">
                    <h3 className="font-serif text-sm font-bold text-[#2C2C2C] flex items-center space-x-1.5 pb-2 border-b border-[#E5E4DE]">
                      <MessageSquare className="w-4 h-4 text-[#7D8471]" />
                      <span>沙龍問答與墨海回響 ({comments.length})</span>
                    </h3>

                    {/* Comments block */}
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <p className="text-xs text-[#2C2C2C]/55 italic py-4 font-serif">
                          「沙龍空靈，尚無回音。在此寫下第一筆吧。」
                        </p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="text-xs bg-[#F4F3EE]/40 border border-[#E5E4DE]/40 p-3 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-[#2C2C2C]/50 font-mono">
                              <span className="font-serif text-[#2C2C2C] font-semibold flex items-center">
                                <CornerDownRight className="w-3.5 h-3.5 mr-1 text-[#2C2C2C]/60" />
                                {c.author}
                              </span>
                              <span>{new Date(c.createdAt).toLocaleDateString('zh-TW')}</span>
                            </div>
                            <p className="font-serif text-[#2C2C2C] pl-4 leading-relaxed whitespace-pre-wrap">
                              {c.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Post Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="bg-[#F4F3EE] border border-[#E5E4DE] p-4 rounded-2xl space-y-3.5">
                      <h4 className="font-serif text-xs font-bold text-[#2C2C2C]/60 flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-[#7D8471]" />
                        <span>在此留下您的評析反饋</span>
                      </h4>

                      {commentSuccess && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded font-serif flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>留言成功！已登錄沙龍中欄。</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2.5">
                        <input
                          type="text"
                          required
                          value={newCommentAuthor}
                          onChange={e => setNewCommentAuthor(e.target.value)}
                          placeholder="您的尊姓大名 / 雅稱"
                          className="w-full p-2 bg-white border border-[#E5E4DE] focus:outline-none focus:border-[#7D8471] rounded text-xs"
                        />
                        <textarea
                          required
                          rows={3}
                          value={newCommentContent}
                          onChange={e => setNewCommentContent(e.target.value)}
                          placeholder="在此輸入您的深刻見地與回饋..."
                          className="w-full p-2.5 bg-white border border-[#E5E4DE] focus:outline-none focus:border-[#7D8471] rounded text-xs font-serif leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={commentSubmitting}
                          className="px-4 py-1.5 bg-[#2C2C2C] hover:bg-[#7D8471] text-white text-xs font-serif tracking-wider transition-all rounded flex items-center space-x-1"
                        >
                          {commentSubmitting ? (
                            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>送出留言</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                  </div>

                </div>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* ==================== ADMINISTRATIVE SEAMLESS SIGN-IN MODAL ==================== */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop click to shut */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Login Frame */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#F9F8F6] border border-[#E5E4DE] rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-6 text-center"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 bg-[#F4F3EE] border border-[#E5E4DE] flex items-center justify-center rounded-full mx-auto">
                  <Lock className="w-4 h-4 text-[#7D8471]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2C2C2C]">沙龍內部調遣 ∙ 安全登入</h3>
                <p className="text-[10px] text-[#2C2C2C]/60">本後台密鑰為您防範外人窺探與資料遭改篡。</p>
              </div>

              {loginError && (
                <p className="p-2 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded leading-relaxed">
                  ⚠️ {loginError}
                </p>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-serif font-bold text-[#2C2C2C]/70 uppercase tracking-wider">
                    帳號識別名 User Account
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E5E4DE] rounded text-xs font-mono focus:outline-none focus:border-[#7D8471]"
                    placeholder="例如: admin / editor"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-serif font-bold text-[#2C2C2C]/70 uppercase tracking-wider">
                    安全密鑰密碼 Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E5E4DE] rounded text-xs font-mono focus:outline-none focus:border-[#7D8471]"
                    placeholder="管理帳戶對應密碼"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2 bg-[#2C2C2C] hover:bg-[#7D8471] text-white text-xs font-serif uppercase tracking-widest transition-all rounded pt-2.5"
                >
                  {loginLoading ? "秘密密鑰驗核中..." : "解鎖踏入後台"}
                </button>
              </form>

              {/* DEMO ACCOUNTS HELPER BOX */}
              <div className="p-3 bg-[#F4F3EE] border border-[#E5E4DE] rounded text-left text-[10px] text-[#2C2C2C]/60 space-y-1 leading-relaxed">
                <p className="font-bold text-[#2C2C2C] flex items-center">
                  💡 後台管理雙重角色密鑰（無須自設）：
                </p>
                <div className="font-mono text-[9px] divide-y divide-[#E5E4DE] pt-1">
                  <div className="py-1">🔑 系統管理者：帳號: <span className="font-bold text-[#2C2C2C]">admin</span> / 密碼: <span className="font-bold text-[#2C2C2C]">admin123</span></div>
                  <div className="py-1">🔑 內容編輯員：帳號: <span className="font-bold text-[#2C2C2C]">editor</span> / 密碼: <span className="font-bold text-[#2C2C2C]">editor123</span></div>
                </div>
              </div>

              <button
                onClick={() => setShowLoginModal(false)}
                className="text-[10.5px] font-serif text-[#2C2C2C]/60 hover:text-[#2C2C2C] underline decoration-dotted block mx-auto"
              >
                關閉返回
              </button>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* ==================== AESTHETIC RECEPTIVE BOTTOM BAR (FOOTER) ==================== */}
      <footer className="border-t border-[#E5E4DE] bg-[#F9F8F6] py-10 mt-16 text-center space-y-4">
        <p className="font-serif text-xs text-[#2C2C2C]/60">
          © {new Date().getFullYear()} 微光沙龍 ∙ Horizon All Rights Reserved.
        </p>

        <p className="font-mono text-[9px] text-[#2C2C2C]/50">
          紙墨氣息 ∙ 智慧感應 ∙ 零快取輕盈載入 ∙ 
          <span 
            onClick={() => {
              if (token) {
                setIsAdminOpened(true);
              } else {
                setShowLoginModal(true);
              }
            }}
            className="ml-1 text-[#2C2C2C] font-serif font-bold underline cursor-pointer hover:text-[#7D8471]"
          >
            【 踏入沙龍管轄後台 】
          </span>
        </p>
      </footer>

    </div>
  );
}
