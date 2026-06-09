import * as React from "react";
import { useState, useEffect } from "react";
import { 
  FileText, Plus, Edit2, Trash2, Check, X, ShieldAlert, 
  Settings, Layers, RefreshCw, Eye, Globe2, Sparkles, BookOpen, Upload 
} from "lucide-react";
import { PortfolioItem, Comment, SEOConfiguration } from "../types";

interface AdminPanelProps {
  token: string;
  role: 'admin' | 'editor';
  onLogout: () => void;
  onRefreshPublic: () => void;
}

export default function AdminPanel({ token, role, onLogout, onRefreshPublic }: AdminPanelProps) {
  // Tabs: 'items' | 'comments' | 'seo'
  const [activeTab, setActiveTab] = useState<'items' | 'comments' | 'seo'>('items');

  // Loaders & Messages
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // States
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [comments, setComments] = useState<(Comment & { itemTitle?: string })[]>([]);
  const [seo, setSeo] = useState<SEOConfiguration>({
    title: "",
    description: "",
    keywords: "",
    author: ""
  });

  // Editor modal/form state
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // File Upload Handling
  const performUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerError("請選擇有效的圖像檔案進行上傳。");
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              fileName: file.name,
              base64Data: reader.result as string
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "檔案上傳伺服器失敗");

          setEditingItem(prev => {
            if (!prev) return null;
            return {
              ...prev,
              imageUrl: data.url
            };
          });
          triggerSuccess(`「${file.name}」封面圖片上傳成功！`);
        } catch (innerErr: any) {
          triggerError(innerErr.message || "上傳程序出現異常");
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        triggerError("讀取本機影像檔案失敗");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerError(err.message || "檔案處理異常");
      setUploading(false);
    }
  };

  // Fetch all items (admin edition)
  const fetchAllItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/portfolio", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("讀取作品集失敗");
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      setErrorMsg(err.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all comments (admin moderation)
  const fetchAllComments = async () => {
    try {
      const res = await fetch("/api/admin/comments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("讀取留言失敗");
      const data = await res.json();
      setComments(data);
    } catch (err: any) {
      setErrorMsg(err.message || "讀取評論失敗");
    }
  };

  // Fetch current SEO settings
  const fetchSEO = async () => {
    try {
      const res = await fetch("/api/seo");
      if (res.ok) {
        const data = await res.json();
        setSeo(data);
      }
    } catch (err) {
      console.error("SEO fetch error:", err);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchAllItems();
    fetchAllComments();
    fetchSEO();
  }, [token]);

  // Flash positive message
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 4120);
  };

  // Flash negative message
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 5120);
  };

  // Handle Portfolio Item Submit (POST / PUT)
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.category || !editingItem?.content) {
      triggerError("請填寫所有必填欄位 (標題、分類與正文內容)");
      return;
    }

    try {
      setActionLoading(true);
      const isEdit = !!editingItem.id;
      const url = isEdit ? `/api/admin/portfolio/${editingItem.id}` : "/api/admin/portfolio";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingItem)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "儲存作品失敗");

      triggerSuccess(isEdit ? "作品修改成功" : "新增作品成功");
      setIsFormOpen(false);
      setEditingItem(null);
      await fetchAllItems();
      onRefreshPublic();
    } catch (err: any) {
      triggerError(err.message || "儲存失敗");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Portfolio Item
  const handleDeleteItem = async (id: string) => {
    if (role !== "admin") {
      triggerError("權限限制：僅系統管理員(admin)可執行刪除作品。內容編輯(editor)無此權限。");
      return;
    }

    if (!window.confirm("確定要刪除此作品嗎？此操作將會連同所有留言一併永久抹除，無法還原！")) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/portfolio/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");

      triggerSuccess("作品與其相關留言隨筆已悉數移除");
      await fetchAllItems();
      await fetchAllComments();
      onRefreshPublic();
    } catch (err: any) {
      triggerError(err.message || "刪除失敗");
    } finally {
      setActionLoading(false);
    }
  };

  // Moderate Comment (Approve)
  const handleApproveComment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("審核通過失敗");
      triggerSuccess("讀者留言審核核准，已公開發布於外網");
      await fetchAllComments();
      onRefreshPublic();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  // Moderate Comment (Unapprove / Hide)
  const handleUnapproveComment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}/unapprove`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("撤回審核失敗");
      triggerSuccess("留言已撤回審核，轉為默默隱藏狀態");
      await fetchAllComments();
      onRefreshPublic();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("確定刪除此讀者留言嗎？此舉無法復原！")) return;

    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("留言刪除失敗");
      triggerSuccess("該條評論已自資料庫永久刪除");
      await fetchAllComments();
      onRefreshPublic();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  // Save SEO Configuration
  const handleSeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(seo)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "儲存失敗");

      triggerSuccess("SEO 全站檢索描述及關鍵字設定已全新套用");
    } catch (err: any) {
      triggerError(err.message || "更新失敗");
    } finally {
      setActionLoading(false);
    }
  };

  // Mock auto-generate description with AI assistant logic
  const handleAutoOptimizeSEO = () => {
    setSeo({
      title: "微光寫真與哲學間隙 ｜ 個人藝文創作沙龍",
      description: "一處沉浸式的慢讀個人美學展示。在光影褶皺中尋找日常溫度，收錄斑駁膠片攝影紀錄、原創中短篇隨筆、對立無留白Wabi-Sabi網頁式交互排版設計。",
      keywords: "膠片發色, 一九九二, 侘寂排版, 雨聲白噪音, 慢讀生活, 設計美學, 個人作品分享",
      author: seo.author || "Horizon 水平線"
    });
    triggerSuccess("AI 協同優化成功！已為您匹配高權重文青風格語調，請預覽網頁摘要後點擊保存。");
  };

  return (
    <div className="bg-transparent min-h-[500px]">
      
      {/* Messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-pulse">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Admin Tab Header Navigation */}
      <div className="flex border-b border-[#E5E4DE] mb-6">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-serif text-xs uppercase tracking-widest transition-all cursor-pointer relative ${
            activeTab === 'items' 
              ? "text-[#2C2C2C] font-semibold" 
              : "text-[#2C2C2C]/50 hover:text-[#2C2C2C]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>作品典藏庫</span>
          {activeTab === 'items' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#7D8471]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-serif text-xs uppercase tracking-widest transition-all cursor-pointer relative ${
            activeTab === 'comments' 
              ? "text-[#2C2C2C] font-semibold" 
              : "text-[#2C2C2C]/50 hover:text-[#2C2C2C]"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>留言審查室</span>
          {activeTab === 'comments' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#7D8471]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-serif text-xs uppercase tracking-widest transition-all cursor-pointer relative ${
            activeTab === 'seo' 
              ? "text-[#2C2C2C] font-semibold" 
              : "text-[#2C2C2C]/50 hover:text-[#2C2C2C]"
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>全站 SEO 參數</span>
          {activeTab === 'seo' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#7D8471]" />
          )}
        </button>
      </div>

      {/* TAB 1: PORTFOLIO ITEMS EDITION */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          
          {/* Top action controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-[#2C2C2C]/60">
                目前共典藏 <span className="font-bold underline text-[#7D8471] font-mono">{items.length}</span> 件作品。您當前的權限角色為：
                <span className={`px-2 py-0.5 ml-1 rounded-full text-[10px] font-bold ${
                  role === 'admin' 
                    ? "bg-rose-100 text-rose-800" 
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {role === 'admin' ? "管理員 admin" : "內容編輯 editor"}
                </span>
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={fetchAllItems}
                className="p-2 bg-[#F4F3EE] hover:bg-[#E5E4DE] text-[#2C2C2C]/70 rounded-xl transition-all cursor-pointer"
                title="重新整理列表"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  setEditingItem({
                    title: "",
                    category: "寫真",
                    imageUrl: "",
                    content: "",
                    isPublished: true,
                    excerpt: ""
                  });
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#7D8471] hover:bg-[#7D8471]/90 text-white font-serif text-xs tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>發表新作品</span>
              </button>
            </div>
          </div>

          {/* Form Editor (Create or update toggle) */}
          {isFormOpen && editingItem && (
            <div className="bg-white border border-[#E5E4DE] rounded-3xl p-5 sm:p-6 shadow-md transition-all animate-fade-in">
              <h4 className="font-serif text-sm font-bold text-[#2C2C2C] pb-3 border-b border-[#E5E4DE] flex items-center justify-between">
                <span>{editingItem.id ? "編輯典藏作品 ✍🏼" : "發表新創作物 🪶"}</span>
                <button 
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                  }}
                  className="p-1 hover:bg-[#F4F3EE] text-[#2C2C2C]/50 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </h4>

              <form onSubmit={handleItemSubmit} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="font-serif font-bold text-[#2C2C2C]/70">作品標題 (正名)</label>
                    <input
                      type="text"
                      required
                      value={editingItem.title}
                      onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                      placeholder="例：光影褶皺下的時間縫隙"
                      className="w-full p-2.5 bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471]"
                    />
                  </div>

                  {/* Category select */}
                  <div className="space-y-1">
                    <label className="font-serif font-bold text-[#2C2C2C]/70">沙龍分類</label>
                    <select
                      value={editingItem.category}
                      onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full p-2.5 bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471] text-xs"
                    >
                      <option value="寫真">寫真 (膠片、隨手攝影記錄)</option>
                      <option value="隨筆">隨筆 (中短篇哲學小品印記)</option>
                      <option value="企劃">企劃 (專欄獨立策展)</option>
                      <option value="評論">評論 (書影哲學反響)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cover Image Upload & URL */}
                  <div className="space-y-1.5">
                    <label className="font-serif font-bold text-[#2C2C2C]/80 flex items-center justify-between">
                      <span>封面首圖上傳</span>
                      <span className="text-[10px] text-[#2C2C2C]/40 font-serif">支援拖曳、點擊或貼上連結</span>
                    </label>
                    
                    {/* Visual Dropzone box */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => {
                        e.preventDefault();
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          await performUpload(files[0]);
                        }
                      }}
                      className="border border-dashed border-[#E5E4DE] hover:border-[#7D8471] rounded-2xl p-3.5 bg-[#F9F8F6] transition-all text-center group cursor-pointer relative"
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center justify-center py-2 space-y-1">
                          <RefreshCw className="w-5 h-5 text-[#7D8471] animate-spin" />
                          <span className="text-[11px] text-[#2C2C2C]/70 font-serif">沖洗底片上傳中...</span>
                        </div>
                      ) : editingItem.imageUrl ? (
                        <div className="flex items-center space-x-3 text-left">
                          <img 
                            src={editingItem.imageUrl} 
                            alt="Preview" 
                            className="w-12 h-12 rounded-lg object-cover border border-[#E5E4DE] bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-[#2C2C2C]/50 truncate font-mono">{editingItem.imageUrl}</p>
                            <button
                              type="button"
                              onClick={() => setEditingItem({ ...editingItem, imageUrl: "" })}
                              className="text-[10px] text-rose-600 hover:underline font-serif mt-0.5"
                            >
                              重置首圖，重新上傳
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-1.5">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async e => {
                              if (e.target.files && e.target.files.length > 0) {
                                await performUpload(e.target.files[0]);
                              }
                            }}
                          />
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <Upload className="w-5 h-5 text-[#2C2C2C]/40 group-hover:text-[#7D8471] transition-colors" />
                            <p className="text-[11px] text-[#2C2C2C]/70 font-serif">
                              隨手拖入，或 <span className="text-[#7D8471] underline font-semibold">點擊底片夾上傳</span>
                            </p>
                            <p className="text-[9px] text-[#2C2C2C]/35">JPG, PNG, WEBP, GIF, SVG</p>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Text Link Input Fallback */}
                    <input
                      type="text"
                      value={editingItem.imageUrl || ""}
                      onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                      placeholder="或是貼上 Unsplash 外部圖片連結 (https://...)"
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471] text-[10px] font-mono placeholder:text-[9.5px]"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1">
                    <label className="font-serif font-bold text-[#2C2C2C]/70">前言簡介 (卡片展示摘要, 留空自動截取正文)</label>
                    <input
                      type="text"
                      value={editingItem.excerpt || ""}
                      onChange={e => setEditingItem({ ...editingItem, excerpt: e.target.value })}
                      placeholder="簡述此件作品透射的美學氛圍..."
                      className="w-full p-2.5 bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471]"
                    />
                  </div>
                </div>

                {/* Content body */}
                <div className="space-y-1">
                  <label className="font-serif font-bold text-[#2C2C2C]/70">作品本格正文 (支持 Markdown 排版)</label>
                  <textarea
                    required
                    rows={8}
                    value={editingItem.content}
                    onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                    placeholder="請緩緩傾注您在此件藝文創作的靈魂與筆觸，本站備有 Wabi-Sabi 的大留白高對比排版，文字呼吸感極佳..."
                    className="w-full p-2.5 bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471] leading-relaxed font-serif"
                  />
                </div>

                <div className="flex items-center space-x-6 pb-2 border-b border-[#E5E4DE]/50">
                  {/* Is published toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer font-serif text-[#2C2C2C]/80">
                    <input
                      type="checkbox"
                      checked={editingItem.isPublished !== false}
                      onChange={e => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded border-[#E5E4DE] text-[#7D8471] focus:ring-[#7D8471]"
                    />
                    <span>公開發布於外網隨筆沙龍區</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 bg-[#F4F3EE] text-[#2C2C2C]/80 rounded-xl hover:bg-[#E5E4DE] transition-all cursor-pointer"
                  >
                    取消
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#2C2C2C] hover:bg-[#7D8471] text-white font-serif tracking-widest rounded-xl transition-all uppercase cursor-pointer"
                  >
                    {actionLoading ? "傾注儲存中..." : "保存並發佈"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List display */}
          <div className="bg-white border border-[#E5E4DE] rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#E5E4DE]">
              {items.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#2C2C2C]/50 italic">
                  目前資料庫空無一物，靜待靈魂墨水。
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[#F4F3EE]/30 transition-all text-xs">
                    <div className="min-w-0 pr-4 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-[#2C2C2C] truncate block max-w-xs sm:max-w-md">
                          {item.title}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#F4F3EE] text-[#2C2C2C]/60 text-[10px] font-serif rounded">
                          {item.category}
                        </span>
                        {!item.isPublished && (
                          <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-500 text-[9px] font-serif rounded">
                            草稿・默默封藏
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-[#2C2C2C]/50 font-mono flex items-center space-x-4">
                        <span>按讚數：{item.likes || 0}</span>
                        <span>留言數：{item.commentsCount || 0}</span>
                        <span>人氣：{item.views || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingItem({ ...item });
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#F4F3EE] border border-[#E5E4DE] text-[#2C2C2C]/70 hover:border-[#7D8471] hover:text-[#7D8471] transition-all cursor-pointer"
                        title="編輯此作品"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className={`p-1.5 rounded-lg bg-[#F4F3EE] border border-[#E5E4DE] transition-all ${
                          role === 'admin' 
                            ? "text-rose-700 hover:border-rose-400 hover:bg-rose-50 cursor-pointer" 
                            : "text-[#E5E4DE] cursor-not-allowed"
                        }`}
                        title={role === 'admin' ? "刪除此作品" : "內容編輯無法刪除作品"}
                        disabled={role !== 'admin'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMENTS MODERATION */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="bg-[#F4F3EE]/50 p-4 rounded-3xl border border-[#E5E4DE]/50">
            <h4 className="font-serif text-sm font-semibold text-[#2C2C2C]">沙龍意見讀者留言審查區</h4>
            <p className="text-[11px] text-[#2C2C2C]/60">管理全站作品的讀者討論。支持「審核/隱藏」以及「刪除惡意留言」操作，保障沙龍言論的優雅氛圍。</p>
          </div>

          <div className="bg-white border border-[#E5E4DE] rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#E5E4DE]">
              {comments.length === 0 ? (
                <p className="p-8 text-center text-xs text-[#2C2C2C]/50 italic">暫無任何讀者回饋留言。</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="p-4 hover:bg-[#F4F3EE]/30 transition-all text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-[#2C2C2C]">{comment.author}</span>
                        <span className="text-[10px] text-[#2C2C2C]/50 font-mono">
                          {new Date(comment.createdAt).toLocaleString('zh-TW')}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-serif border ${
                          comment.isApproved 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                        }`}>
                          {comment.isApproved ? "已公開發佈" : "審核中・默默隱藏"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                        {comment.isApproved ? (
                          <button
                            onClick={() => handleUnapproveComment(comment.id)}
                            className="flex items-center space-x-1 px-2 py-1 bg-[#F4F3EE] border border-[#E5E4DE] text-[#2C2C2C]/60 rounded-lg hover:border-amber-400 hover:text-amber-700 transition-all font-serif cursor-pointer"
                            title="撤回審核隱藏"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>隱藏</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveComment(comment.id)}
                            className="flex items-center space-x-1 px-2 py-1 bg-[#7D8471] text-white rounded-lg hover:bg-[#7D8471]/90 transition-all font-serif cursor-pointer"
                            title="審核發布公開"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>發布</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 px-2 bg-[#F4F3EE] border border-[#E5E4DE] text-rose-700 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer"
                          title="永久刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-[#2C2C2C] font-serif bg-white/70 p-2.5 rounded-2xl border border-[#E5E4DE] leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>

                    <div className="mt-2 text-[10px] text-[#2C2C2C]/60 flex items-center space-x-1">
                      <span className="font-serif">發表於：</span>
                      <span className="underline italic font-serif text-[#7D8471]">{comment.itemTitle}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL SEO SETTINGS */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="bg-[#F4F3EE]/50 p-4 rounded-3xl border border-[#E5E4DE]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-serif text-sm font-semibold text-[#2C2C2C]">搜尋引擎優化與全站權益</h4>
              <p className="text-[11px] text-[#2C2C2C]/60">設定 Google 與 Yahoo 搜尋所使用的 Meta 標題、描述、檢索字眼，以利全站 SEO 優化。</p>
            </div>
            
            <button
              type="button"
              onClick={handleAutoOptimizeSEO}
              className="px-3 py-1.5 bg-[#7D8471]/10 text-[#7D8471] border border-[#7D8471]/30 font-serif text-[11px] rounded-xl hover:bg-[#7D8471]/20 flex items-center justify-center space-x-1 shrink-0 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 降噪調優 SEO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SEO Form */}
            <form onSubmit={handleSeoSubmit} className="bg-white border border-[#E5E4DE] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h5 className="font-serif text-xs font-bold text-[#2C2C2C] flex items-center space-x-1.5 pb-2 border-b border-[#E5E4DE]">
                <Settings className="w-4 h-4 text-[#7D8471]" />
                <span>SEO 參數細部調整</span>
              </h5>

              <div className="space-y-1">
                <label className="text-[11px] font-serif font-bold text-[#2C2C2C]/60">全站搜尋標題 (Meta Title)</label>
                <input
                  type="text"
                  required
                  value={seo.title}
                  onChange={e => setSeo({ ...seo, title: e.target.value })}
                  className="w-full p-2 text-xs bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471]"
                  placeholder="全站 Meta Title 網頁標題"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-serif font-bold text-[#2C2C2C]/60">文青筆名作者 (Author Name)</label>
                <input
                  type="text"
                  value={seo.author}
                  onChange={e => setSeo({ ...seo, author: e.target.value })}
                  className="w-full p-2 text-xs bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471]"
                  placeholder="Horizon / 塵世水平線"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-serif font-bold text-[#2C2C2C]/60">熱度關鍵字 (Meta Keywords - 多個請用逗號隔開)</label>
                <input
                  type="text"
                  value={seo.keywords}
                  onChange={e => setSeo({ ...seo, keywords: e.target.value })}
                  className="w-full p-2 text-xs bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471]"
                  placeholder="底片, 膠片寫真, 侘寂排版, 雨天隨想"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-serif font-bold text-[#2C2C2C]/60">全站摘要描述 (Meta Description - 攸關搜尋摘要亮點!)</label>
                <textarea
                  required
                  rows={4}
                  value={seo.description}
                  onChange={e => setSeo({ ...seo, description: e.target.value })}
                  className="w-full p-2 text-xs bg-[#F9F8F6] border border-[#E5E4DE] rounded-xl focus:outline-none focus:border-[#7D8471] leading-relaxed"
                  placeholder="Meta Description: 全網索引關鍵引言描述..."
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-[#2C2C2C] hover:bg-[#7D8471] text-white text-xs font-serif uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                儲存 SEO 配設
              </button>
            </form>

            {/* SEO Real-time Google Card Mockup Simulator */}
            <div className="bg-white border border-[#E5E4DE] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h5 className="font-serif text-xs font-bold text-[#2C2C2C]/70 flex items-center space-x-1.5 pb-2 border-b border-[#E5E4DE]">
                  <Globe2 className="w-4 h-4 text-[#7D8471]" />
                  <span>Google 搜尋引擎模擬預覽 (SERP Simulator)</span>
                </h5>

                <div className="mt-4 p-4 bg-[#F9F8F6] rounded-2xl border border-[#E5E4DE]/50 shadow-inner space-y-1 text-left">
                  {/* Google search hierarchy */}
                  <div className="flex items-center space-x-1 text-xs text-[#202124]">
                    <span className="font-sans text-[11px]">https://horizon-salon.cloudrun.app</span>
                    <span className="text-[#5f6368] text-[10px]">› salon</span>
                  </div>

                  {/* Title Link */}
                  <h4 className="text-[17px] text-[#1a0dab] font-sans hover:underline cursor-pointer font-medium leading-snug">
                    {seo.title || "請填寫 Meta 標題"}
                  </h4>

                  {/* Description snippet */}
                  <p className="text-[13px] text-[#4d5156] font-sans leading-relaxed break-all">
                    <span className="text-[#70757a] font-mono text-[10px] mr-1.5">
                      {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })} —
                    </span>
                    {seo.description || "請填寫 Meta 描述，幫助訪客在搜尋引擎網頁的第一時間迅速聚焦您的作品精髓優勢。"}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {seo.keywords ? (
                      seo.keywords.split(',').map((kw, i) => (
                        <span key={i} className="text-[10px] font-mono bg-[#F4F3EE] text-[#2C2C2C]/70 px-1.5 py-0.5 rounded">
                          #{kw.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">無設定搜尋關鍵字</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-[#F4F3EE]/65 p-3 rounded-2xl text-[11px] text-[#2C2C2C]/65 leading-relaxed">
                <span className="font-bold text-[#2C2C2C]">⭐ SEO 機制解密：</span>
                我們在 React 層面使用動態 Document Title 綁定與 JSON-LD 語義化結構，並在 API 介面完美返回格式化 Meta
                摘要。這對於搜尋爬蟲（Web Crawlers）提取作品，達成秒級收錄與引流有極高助益。
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
