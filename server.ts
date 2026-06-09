import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PortfolioItem, Comment, User, AnalyticsLog, SEOConfiguration } from "./src/types";

// Setup server and database path
const app = express();
const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware with higher limits for file uploading
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Initialize default database records
const defaultSEO: SEOConfiguration = {
  title: "微光沙龍 ｜ 水平線的個人作品集與生活隨筆",
  description: "紀錄時間與光影的形狀。這裡是一處文藝空間，收藏膠片攝影、敘事隨筆散文以及數位視覺設計作品，在快節奏世界中尋找慢下來的呼吸。",
  keywords: "個人作品集, 膠片攝影, 文藝隨筆, 視覺設計, 美學生活, 靜物紀錄, 讀書筆記",
  author: "Horizon / 水平線"
};

const defaultItems: PortfolioItem[] = [
  {
    id: "photo-01",
    title: "光影的褶皺 ｜ 舊鐵道與午後三點的暖流",
    category: "膠片攝影",
    date: "2026-05-18",
    summary: "在荒廢的月台上，捕捉被風揚起的窗簾及斜射而入的橘黃色微光。使用的是 1992 年產的底片相機，顆粒感在時間中沉澱。",
    content: `### 膠片所記錄的，是無法重來的溫度

有些街角適合被遺忘，有些光線只在特定的下午三點零八分出現。

我帶著一台斑駁的 **Minolta X-700** 手動對焦相機，裝著一卷過期兩年的 **Kodak Portra 400**，晃蕩在城市的邊緣。這座廢棄的舊火車站月台已經很久沒有旅客了。午後的陽光透過破碎的綠色玻璃窗格，像流動的蜂蜜一樣傾瀉在斑駁的水泥地上。

#### 拍攝參數
* **機身**：Minolta X-700
* **鏡頭**：50mm f/1.4 MD Rokkor
* **底片**：Kodak Portra 400 (過期)
* **沖掃**：Noritsu Koki 專業掃描

底片攝影的魅力在於它的「不可即時檢視性」。你必須等待，將光轉成化學反應，再由時間浸潤。看著藥水洗出的顯影，那種些微的色偏與溫柔的顆粒，彷彿將那一刻的空氣、溫度、甚至微風的呼嘯，都一併摺疊進了這張小小的乳劑薄膜中。

「我們在一張照片裡尋找的，往往不是現實的精準，而是感受的餘溫。」`,
    imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=85&w=1200",
    views: 412,
    likes: 85,
    commentsCount: 3,
    tags: ["膠片", "生活隨筆", "光影紀錄", "過期底片"]
  },
  {
    id: "prose-02",
    title: "午後雨聲 ｜ 關於時間、塵埃與黑膠唱片",
    category: "文學創作",
    date: "2026-06-02",
    summary: "雨水落在綠葉與雨棚上發出的白噪音，與 Bill Evans 的鋼琴聲融為一體。這是一篇關於台北潮濕午後與記憶提取的極短篇散文。",
    content: `### 潮濕的記憶提取

台北的雨總是來得毫無防備。

推開窗，迎面而來的是帶著泥土腥氣與柏油吸水後的微熱感。空氣中的濕度逼近 90%，連案頭上的稿紙都顯得有些疲軟。我把唱針輕輕放在 **Bill Evans Trio** 的 《Waltz for Debby》 黑膠唱片上。雜音劈啪作響，像極了窗外細碎的雨聲。

> 「雨是時間的實體化，它讓看不見的空氣阻力，變成了看得見、聽得見的漣漪。」

#### 雨天與物件的低語
在這樣的日子裡，日常的物件好像都活了過來：
1. **鑄鐵茶壺**：發出隱約的鳴響，壺嘴吐出白色的蒸氣，帶著普洱茶的陳香。
2. **黃銅鎮紙**：壓著未完的詩稿，在陰天裡反射出黯淡而古雅的金色。
3. **老相機**：冰冷的金屬外殼，吸納著室內的微弱光線。

我們活在一個追求速度與極致解析度的時代，然而，生活真正動人的部分，往往藏在那些「不夠精準、帶有顆粒、甚至略顯潮濕」的夾縫中。黑膠的類比訊號、信件的墨水筆觸，都在用它們斑駁的肉身，對抗著數位長河的無情沖刷。

下一次下雨時，請試著關掉熱水器的喧囂，聽聽雨滴與葉片的磨合。`,
    imageUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=85&w=1200",
    views: 289,
    likes: 64,
    commentsCount: 2,
    tags: ["散文隨筆", "黑膠唱片", "雨天美學", "文字紀錄"]
  },
  {
    id: "design-03",
    title: "「無與空白」 ｜ 日式侘寂美學在網頁排版中的實踐",
    category: "視覺設計",
    date: "2026-06-07",
    summary: "探討日式「間 (Ma)」的概念如何應用於現代網頁設計。通過極致的留白、自然感色調與流暢的物理動畫，讓網頁版面流露墨香墨意。",
    content: `### 留白：一種刻意的沉默

在設計師的字典裡，什麼都不放，比放滿更需要勇氣。

「留白」不只是空無一物，在日式侘寂（Wabi-Sabi）美學中，它被稱為「間（Ma）」。它是呼吸的管道，是讓觀看者的視覺與心靈得以駐足的空間。

#### 設計的三個留白核心理論

* **壓縮與膨脹**：刻意拉大標題與正文的間距，造成排版上的張力。
* **低對比的溫柔**：避免使用純黑（#000）與純白（#FFF），我們改用溫潤的燕麥石色（Oatmeal）與深沉的炭墨灰（Charcoal）。
* **物理性的動能**：所有的換頁與顯影應該像「墨水在宣紙上暈開」或「微風掀起紗簾」，輕柔、舒緩，具有自然的摩擦力。

#### 配色實驗
- **背景底色**：\`#FAF8F5\`（稻香白）- 溫暖、不刺眼
- **主文字色**：\`#1C1A17\`（石煤黑）- 古樸且沉著
- **輔助裝飾**：\`#5C6B53\`（青苔綠）- 帶來一抹自然生機

現代 UI 被過多的按鈕、徽章、漸層、浮誇的動效給填滿了。「無與空白」的設計實踐，就像是在喧囂的鬧市中築起一間茶室。我們希望這套網站系統也能傳遞這份寂靜——讓文字與圖片成為主角，讓使用者的視線在呼吸間自由穿梭。`,
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=85&w=1200",
    views: 521,
    likes: 122,
    commentsCount: 2,
    tags: ["網頁排版", "侘寂美學", "UI設計", "留白藝術"]
  }
];

const defaultComments: Comment[] = [
  {
    id: "comment-1",
    itemId: "photo-01",
    author: "沐之 (Muzhi)",
    content: "看著這張黃昏底片照片，突然想起了小時候外婆家的紗窗，也是這樣被夕陽染成金黃澄澈。很有溫度的作品！",
    createdAt: "2026-06-08T08:30:00Z",
    isApproved: true
  },
  {
    id: "comment-2",
    itemId: "photo-01",
    author: "旅行的風",
    content: "Minolta X-700 確實是神機，配上 Portra 400 過期的發色，帶有一種淡淡的憂鬱橄欖綠感，太會拍了！",
    createdAt: "2026-06-08T09:15:00Z",
    isApproved: true
  },
  {
    id: "comment-3",
    itemId: "prose-02",
    author: "書頁上的咖啡漬",
    content: "非常喜歡這句「雨是時間的實體化」。在速食時代，能坐下來讀完這樣一篇有溫度的文字，像是喝了一杯溫熱的拿鐵咖啡。",
    createdAt: "2026-06-08T10:45:00Z",
    isApproved: true
  },
  {
    id: "comment-4",
    itemId: "design-03",
    author: "極簡主義工程師",
    content: "這網站本身的文青風格與字體間距（Space Grotesk + Noto Serif）就是對侘寂美學的最佳詮釋！大讚！",
    createdAt: "2026-06-08T14:20:00Z",
    isApproved: true
  },
  {
    id: "comment-5",
    itemId: "photo-01",
    author: "匿名讀者",
    content: "這是一則待審核的測試留言。系統運作很順暢！",
    createdAt: "2026-06-09T01:10:00Z",
    isApproved: false // Starts as unapproved for moderation demo
  }
];

const defaultUsers: User[] = [
  {
    username: "admin",
    role: "admin",
    passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // admin123
  },
  {
    username: "editor",
    role: "editor",
    passwordHash: "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8" // editor123 (demo fallback / SHA-like)
  }
];

// Let's create an elegant auto-generator for historical logs so the analytics dashboard is beautiful
const generateMockLogs = (): AnalyticsLog[] => {
  const logs: AnalyticsLog[] = [];
  const devices: ('Desktop' | 'Mobile' | 'Tablet')[] = ['Desktop', 'Mobile', 'Tablet', 'Mobile', 'Desktop'];
  const referrers = [
    '直接存取 / 書籤',
    'Google 搜尋',
    'Instagram 推薦',
    'Facebook 社群',
    'Medium 文藝專欄',
    'Pinterest 靈感板'
  ];
  
  // Date offset helper
  const now = new Date();
  
  // Generate data for the past 7 days
  for (let i = 0; i < 7; i++) {
    const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = logDate.toISOString().split('T')[0];
    
    // Day-of-week factor to make graphs organic
    const factor = (i % 3 === 0) ? 1.4 : 0.8;
    const viewCount = Math.floor((120 - i * 8) * factor);
    const likeCount = Math.floor((25 - i * 2) * factor);
    const commentCount = Math.floor((6 - i * 0.5) * factor);
    
    // Generate individual log details for high granularity
    for (let j = 0; j < viewCount; j++) {
      const logHour = Math.floor(Math.random() * 24);
      const logMin = Math.floor(Math.random() * 60);
      const logSec = Math.floor(Math.random() * 60);
      const timestamp = `${dateString}T${String(logHour).padStart(2, '0')}:${String(logMin).padStart(2, '0')}:${String(logSec).padStart(2, '0')}Z`;
      
      logs.push({
        id: `log-v-${i}-${j}`,
        timestamp,
        type: 'page_view',
        itemId: j % 3 === 0 ? "photo-01" : j % 3 === 1 ? "prose-02" : "design-03",
        device: devices[Math.floor(Math.random() * devices.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)]
      });
    }
    
    for (let k = 0; k < likeCount; k++) {
      logs.push({
        id: `log-l-${i}-${k}`,
        timestamp: `${dateString}T${Math.floor(Math.random()*12+12)}:10:00Z`,
        type: 'like',
        itemId: k % 2 === 0 ? "photo-01" : "design-03",
        device: devices[Math.floor(Math.random() * devices.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)]
      });
    }

    for (let m = 0; m < commentCount; m++) {
      logs.push({
        id: `log-c-${i}-${m}`,
        timestamp: `${dateString}T${Math.floor(Math.random()*12+12)}:35:00Z`,
        type: 'comment',
        itemId: "photo-01",
        device: devices[Math.floor(Math.random() * devices.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)]
      });
    }
  }
  return logs;
};

// Database state
let dbState = {
  items: defaultItems,
  comments: defaultComments,
  users: defaultUsers,
  seo: defaultSEO,
  logs: generateMockLogs()
};

// Ensure DB directory and load or save DB
function loadDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      dbState = JSON.parse(data);
      console.log("Database successfully loaded from file.");
    } else {
      saveDatabase();
      console.log("Database file created and initialized with defaults.");
    }
  } catch (error) {
    console.error("Failed to load database, using in-memory state:", error);
  }
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database to file:", error);
  }
}

// Perform initial load
loadDatabase();

// Helpers for auth verification
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未授權：請登入後重試" });
  }
  const token = authHeader.split(" ")[1];
  // Simple token format: bearer-admin-admin123 or bearer-editor-editor123
  if (token === "bearer-admin-token") {
    req.user = { username: "admin", role: "admin" };
    return next();
  } else if (token === "bearer-editor-token") {
    req.user = { username: "editor", role: "editor" };
    return next();
  }
  return res.status(401).json({ error: "認證無效，請重新登入" });
};

// Extend standard Request type
declare global {
  namespace Express {
    interface Request {
      user?: { username: string; role: 'admin' | 'editor' };
    }
  }
}

// Custom simple analytics logger middleware to measure page flow
const logVisitor = (type: 'page_view' | 'like' | 'comment', itemId?: string, req?: express.Request) => {
  const devices: ('Desktop' | 'Mobile' | 'Tablet')[] = ['Desktop', 'Mobile', 'Tablet'];
  const userAgent = req?.headers['user-agent'] || '';
  let device: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/mobile/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = 'Tablet';
  }
  
  const referrers = [
    '直接存取 / 書籤',
    'Google 搜尋',
    'Instagram 推薦',
    'Facebook 社群',
    'Medium 文藝專欄',
    'Pinterest 靈感板'
  ];
  const referrerHeader = req?.headers['referer'] || '';
  let matchedReferrer = referrers[0];
  if (/google/i.test(referrerHeader)) matchedReferrer = 'Google 搜尋';
  else if (/instagram/i.test(referrerHeader)) matchedReferrer = 'Instagram 推薦';
  else if (/facebook/i.test(referrerHeader)) matchedReferrer = 'Facebook 社群';
  else if (/medium/i.test(referrerHeader)) matchedReferrer = 'Medium 文藝專欄';
  else if (/pinterest/i.test(referrerHeader)) matchedReferrer = 'Pinterest 靈感板';
  else if (referrerHeader) matchedReferrer = new URL(referrerHeader).hostname;

  const newLog: AnalyticsLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    type,
    itemId,
    device,
    referrer: matchedReferrer
  };
  
  dbState.logs.push(newLog);
  // Keep logs capped at last 10,000 logs to stay performance friendly
  if (dbState.logs.length > 10000) {
    dbState.logs.shift();
  }
  saveDatabase();
};


// API ROUTES

// 1. PUBLIC API - PORTFOLIO ITEMS
app.get("/api/portfolio", (req, res) => {
  res.json(dbState.items);
});

app.get("/api/portfolio/:id", (req, res) => {
  const item = dbState.items.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "找不到該作品" });
  }
  // Increment view count
  item.views = (item.views || 0) + 1;
  saveDatabase();
  logVisitor('page_view', item.id, req);
  res.json(item);
});

// 2. PUBLIC API - LIKES
app.post("/api/portfolio/:id/like", (req, res) => {
  const item = dbState.items.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "找不到該作品" });
  }
  item.likes = (item.likes || 0) + 1;
  saveDatabase();
  logVisitor('like', item.id, req);
  res.json({ success: true, likes: item.likes });
});

// 3. PUBLIC API - COMMENTS
app.get("/api/portfolio/:id/comments", (req, res) => {
  // Returns only approved comments in general mode, unless they pass a preview flag, or just returns all approved ones
  const comments = dbState.comments.filter(c => c.itemId === req.params.id && c.isApproved);
  res.json(comments);
});

app.post("/api/portfolio/:id/comments", (req, res) => {
  const item = dbState.items.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "找不到該作品，無法留言" });
  }
  const { author, content } = req.body;
  if (!author || !content || author.trim() === "" || content.trim() === "") {
    return res.status(400).json({ error: "留言者及留言內容不能為空" });
  }
  
  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    itemId: req.params.id,
    author: author.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    isApproved: true // Auto-approved by default in local settings, can be un-approved in moderation panel
  };
  
  dbState.comments.push(newComment);
  item.commentsCount = (item.commentsCount || 0) + 1;
  
  saveDatabase();
  logVisitor('comment', item.id, req);
  res.status(201).json(newComment);
});

// 4. PUBLIC API - SEO CONFIG
app.get("/api/seo", (req, res) => {
  res.json(dbState.seo);
});


// 5. SECURE ADMIN BACKEND & AUTH
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "請輸入帳號與密碼" });
  }

  // Simple hardcoded credentials comparison
  // admin/admin123 or editor/editor123
  if (username === "admin" && password === "admin123") {
    res.json({
      success: true,
      token: "bearer-admin-token",
      user: { username: "admin", role: "admin" }
    });
  } else if (username === "editor" && password === "editor123") {
    res.json({
      success: true,
      token: "bearer-editor-token",
      user: { username: "editor", role: "editor" }
    });
  } else {
    res.status(401).json({ error: "帳號或密碼錯誤" });
  }
});

// 6. PROTECTED PORTFOLIO DIRECTORY CRUD (requires valid admin or editor role)
app.get("/api/admin/portfolio", verifyToken, (req, res) => {
  res.json(dbState.items);
});

app.post("/api/admin/portfolio", verifyToken, (req, res) => {
  const { title, category, summary, content, imageUrl, tags } = req.body;
  if (!title || !category || !content) {
    return res.status(400).json({ error: "請填寫作品標題、分類與正文內容" });
  }

  const newItem: PortfolioItem = {
    id: `item-${Date.now()}`,
    title,
    category,
    date: new Date().toISOString().split('T')[0],
    summary: summary || content.slice(0, 100) + "...",
    content,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600",
    views: 0,
    likes: 0,
    commentsCount: 0,
    tags: Array.isArray(tags) ? tags : tags ? String(tags).split(',').map(t => t.trim()) : []
  };

  dbState.items.unshift(newItem);
  saveDatabase();
  res.status(201).json(newItem);
});

app.put("/api/admin/portfolio/:id", verifyToken, (req, res) => {
  const itemIndex = dbState.items.findIndex(i => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "找不到該作品" });
  }

  const { title, category, summary, content, imageUrl, tags } = req.body;
  if (!title || !category || !content) {
    return res.status(400).json({ error: "請提供標題、分類與內容" });
  }

  const originalItem = dbState.items[itemIndex];
  dbState.items[itemIndex] = {
    ...originalItem,
    title,
    category,
    summary: summary || content.slice(0, 100) + "...",
    content,
    imageUrl: imageUrl || originalItem.imageUrl,
    tags: Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim())
  };

  saveDatabase();
  res.json(dbState.items[itemIndex]);
});

app.delete("/api/admin/portfolio/:id", verifyToken, (req, res) => {
  // Restriction: Editor can delete portfolio items? Yes, but admin is full access.
  const itemIndex = dbState.items.findIndex(i => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "找不到該作品" });
  }

  dbState.items.splice(itemIndex, 1);
  // Also delete associated comments
  dbState.comments = dbState.comments.filter(c => c.itemId !== req.params.id);

  saveDatabase();
  res.json({ success: true, message: "作品與相關留言已被刪除" });
});

// New Endpoint: SECURE FILE UPLOAD
app.post("/api/admin/upload", verifyToken, (req, res) => {
  const { fileName, base64Data } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: "參數遺失：需要檔名與 base64 檔案數據" });
  }

  try {
    // Clean and validate file extension to maintain safety
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
    const fileExt = path.extname(fileName).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ error: `不允許的檔案類型。目前僅支持：${allowedExtensions.join(", ")}` });
    }

    // Isolate base64 raw buffer
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Establish clean unique filename
    const timestamp = Date.now();
    const cleanBaseName = path.basename(fileName, fileExt).replace(/[^a-zA-Z0-9\-_]/g, "_");
    const safeUniqueName = `${timestamp}_${cleanBaseName}${fileExt}`;
    const targetFilePath = path.join(UPLOADS_DIR, safeUniqueName);

    fs.writeFileSync(targetFilePath, buffer);

    const fileUrl = `/uploads/${safeUniqueName}`;
    res.status(201).json({ 
      success: true, 
      url: fileUrl, 
      fileName: safeUniqueName 
    });
  } catch (err: any) {
    console.error("Express upload handler crashed:", err);
    res.status(500).json({ error: "儲存上傳檔案失敗：" + err.message });
  }
});


// 7. PROTECTED COMMENTS MODERATION (admin or editor)
app.get("/api/admin/comments", verifyToken, (req, res) => {
  // Return all comments with their parent item title linked
  const richComments = dbState.comments.map(c => {
    const item = dbState.items.find(i => i.id === c.itemId);
    return {
      ...c,
      itemTitle: item ? item.title : "已刪除的作品"
    };
  });
  res.json(richComments);
});

app.post("/api/admin/comments/:id/approve", verifyToken, (req, res) => {
  const comment = dbState.comments.find(c => c.id === req.params.id);
  if (!comment) {
    return res.status(404).json({ error: "找不到該留言" });
  }
  comment.isApproved = true;
  saveDatabase();
  res.json({ success: true, comment });
});

app.post("/api/admin/comments/:id/unapprove", verifyToken, (req, res) => {
  const comment = dbState.comments.find(c => c.id === req.params.id);
  if (!comment) {
    return res.status(404).json({ error: "找不到該留言" });
  }
  comment.isApproved = false;
  saveDatabase();
  res.json({ success: true, comment });
});

app.delete("/api/admin/comments/:id", verifyToken, (req, res) => {
  const commentIndex = dbState.comments.findIndex(c => c.id === req.params.id);
  if (commentIndex === -1) {
    return res.status(404).json({ error: "找不到該留言" });
  }
  
  const commentObj = dbState.comments[commentIndex];
  
  // Decrease count in item
  const item = dbState.items.find(i => i.id === commentObj.itemId);
  if (item && item.commentsCount > 0) {
    item.commentsCount--;
  }

  dbState.comments.splice(commentIndex, 1);
  saveDatabase();
  res.json({ success: true, message: "留言已成功刪除" });
});


// 8. PROTECTED ADVANCED ANALYTICS (admin and editor read-only, but Editor cannot clear/delete)
app.get("/api/admin/analytics", verifyToken, (req, res) => {
  const logs = dbState.logs;
  
  // Calculate aggregate values
  const totalViews = dbState.items.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalLikes = dbState.items.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const totalComments = dbState.comments.length;

  // Group views by day (last 7 days)
  const viewsByDay: { [date: string]: { views: number; likes: number; comments: number } } = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dString = d.toISOString().split('T')[0];
    viewsByDay[dString] = { views: 0, likes: 0, comments: 0 };
  }

  logs.forEach(log => {
    const day = log.timestamp.split('T')[0];
    if (viewsByDay[day] !== undefined) {
      if (log.type === 'page_view') viewsByDay[day].views++;
      else if (log.type === 'like') viewsByDay[day].likes++;
      else if (log.type === 'comment') viewsByDay[day].comments++;
    }
  });

  const dailyTrend = Object.keys(viewsByDay).map(day => ({
    date: day,
    ...viewsByDay[day]
  }));

  // Device Breakdown
  const devices: { [device: string]: number } = { Desktop: 0, Mobile: 0, Tablet: 0 };
  logs.filter(l => l.type === 'page_view').forEach(log => {
    if (devices[log.device] !== undefined) {
      devices[log.device]++;
    } else {
      devices[log.device] = 1;
    }
  });

  const deviceDistribution = Object.keys(devices).map(dev => ({
    name: dev,
    value: devices[dev]
  }));

  // Referrer Breakdown
  const referrers: { [source: string]: number } = {};
  logs.filter(l => l.type === 'page_view').forEach(log => {
    const source = log.referrer || "直接存取";
    referrers[source] = (referrers[source] || 0) + 1;
  });

  const referrerDistribution = Object.keys(referrers)
    .map(ref => ({ name: ref, value: referrers[ref] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 sources

  // Top Products/Items by Views
  const popularItems = dbState.items
    .map(item => ({
      id: item.id,
      title: item.title,
      views: item.views || 0,
      likes: item.likes || 0,
      commentsCount: item.commentsCount || 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  res.json({
    summary: {
      totalViews,
      totalLikes,
      totalComments,
      itemCount: dbState.items.length
    },
    dailyTrend,
    deviceDistribution,
    referrerDistribution,
    popularItems
  });
});

app.post("/api/admin/seo", verifyToken, (req, res) => {
  const { title, description, keywords, author } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "標題與描述不能為空" });
  }

  dbState.seo = {
    title,
    description,
    keywords: keywords || "",
    author: author || ""
  };

  saveDatabase();
  res.json({ success: true, seo: dbState.seo });
});


// FRONTEND VITE INTEGRATION MIDDLEWARE
const loadApp = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aura Engine] Running beautifully on http://0.0.0.0:${PORT}`);
  });
};

loadApp();
