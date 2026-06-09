import { useState, useEffect } from "react";
import { Eye, Heart, MessageSquare, BookOpen, Smartphone, Laptop, Tablet, ChevronRight, Activity, Award, Compass } from "lucide-react";

interface PopularItem {
  id: string;
  title: string;
  views: number;
  likes: number;
  commentsCount: number;
}

interface DailyTrend {
  date: string;
  views: number;
  likes: number;
  comments: number;
}

interface DistributionItem {
  name: string;
  value: number;
}

interface AnalyticsData {
  summary: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    itemCount: number;
  };
  dailyTrend: DailyTrend[];
  deviceDistribution: DistributionItem[];
  referrerDistribution: DistributionItem[];
  popularItems: PopularItem[];
}

interface DashboardProps {
  token: string;
  role: 'admin' | 'editor';
}

export default function Dashboard({ token }: DashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeDateIndex, setActiveDateIndex] = useState<number | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("無法載入統計數據，請確認管理權限");
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setErrorMessage(err.message || "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-10 h-10 border-2 border-[#C08D5C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-serif text-[#8E806A] italic">正在調取沙龍漫讀日誌...</p>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="p-8 bg-[#F3ECE2] border border-[#E4D5C1] rounded-lg text-center my-6">
        <p className="text-red-800 font-medium mb-3">{errorMessage || "暫無數據"}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-[#1C1A17] text-[#FAF8F5] text-xs uppercase tracking-widest hover:bg-[#5C6B53] transition-all"
        >
          重新整理
        </button>
      </div>
    );
  }

  const { summary, dailyTrend, deviceDistribution, referrerDistribution, popularItems } = data;

  // Render SVG Line Chart calculations
  const maxViews = Math.max(...dailyTrend.map(d => d.views), 10);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const getCoordinates = () => {
    const pointsCount = dailyTrend.length;
    if (pointsCount === 0) return "";
    return dailyTrend.map((item, index) => {
      const x = paddingX + (index * (chartWidth - paddingX * 2)) / (pointsCount - 1);
      const y = chartHeight - paddingY - (item.views * (chartHeight - paddingY * 2)) / maxViews;
      return `${x},${y}`;
    }).join(" ");
  };

  const getAreaCoordinates = () => {
    const points = getCoordinates();
    if (!points) return "";
    const firstX = paddingX;
    const lastX = chartWidth - paddingX;
    const baseY = chartHeight - paddingY;
    return `${firstX},${baseY} ${points} ${lastX},${baseY}`;
  };

  const totalDeviceViews = deviceDistribution.reduce((acc, current) => acc + current.value, 0) || 1;
  const totalReferrals = referrerDistribution.reduce((acc, current) => acc + current.value, 0) || 1;

  // Formatting date for Taiwanese style
  const formatDateDay = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. KEY CARDS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views Card */}
        <div className="bg-[#7D8471] text-white p-5 lg:p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-white/85 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.2em]">總瀏覽量</span>
            <Eye className="w-4 h-4 text-white/90" />
          </div>
          <div className="mt-4 relative z-10">
            <h4 className="font-serif text-3xl font-serif italic font-bold text-white mb-1">{summary.totalViews}</h4>
            <p className="text-[10px] uppercase tracking-widest text-[#F4F3EE]/70">累積訪客點閱與翻閱紀錄</p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Total Likes Card */}
        <div className="bg-white border border-[#E5E4DE] p-5 lg:p-6 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#2C2C2C]/50">
            <span className="text-[10px] uppercase tracking-[0.2em]">累積喜愛</span>
            <Heart className="w-4 h-4 text-[#7D8471] fill-[#7D8471]" />
          </div>
          <div className="mt-4">
            <h4 className="font-serif text-3xl font-serif italic font-bold text-[#2C2C2C] tracking-tight mb-1">{summary.totalLikes} <span className="text-xs not-italic text-[#7D8471] font-sans font-medium">+12%</span></h4>
            <p className="text-[10px] uppercase tracking-widest text-[#2C2C2C]/50">觀看者按壓收藏之感應</p>
          </div>
        </div>

        {/* Total Comments Card */}
        <div className="bg-white border border-[#E5E4DE] p-5 lg:p-6 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#2C2C2C]/50">
            <span className="text-[10px] uppercase tracking-[0.2em]">留白回響</span>
            <MessageSquare className="w-4 h-4 text-[#7D8471]" />
          </div>
          <div className="mt-4">
            <h4 className="font-serif text-3xl font-serif italic font-bold text-[#2C2C2C] tracking-tight mb-1">{summary.totalComments} <span className="text-xs not-italic text-[#7D8471] font-sans font-medium">75% 回覆</span></h4>
            <p className="text-[10px] uppercase tracking-widest text-[#2C2C2C]/50">讀者沙龍意見與留言交流</p>
          </div>
        </div>

        {/* Active Compositions Card */}
        <div className="bg-white border border-[#E5E4DE] p-5 lg:p-6 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#2C2C2C]/50">
            <span className="text-[10px] uppercase tracking-[0.2em]">精選創作</span>
            <BookOpen className="w-4 h-4 text-[#7D8471]" />
          </div>
          <div className="mt-4">
            <h4 className="font-serif text-3xl font-serif italic font-bold text-[#2C2C2C] tracking-tight mb-1">{summary.itemCount}</h4>
            <p className="text-[10px] uppercase tracking-widest text-[#2C2C2C]/50">攝影、散文與設計總數量</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Historical Views Line Chart */}
        <div className="xl:col-span-2 bg-white border border-[#E5E4DE] rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#E5E4DE] pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#7D8471]" />
              <h3 className="font-serif text-sm font-semibold text-[#2C2C2C]">近期訪客閱覽走勢 (7日)</h3>
            </div>
            <span className="text-[11px] font-mono text-[#2C2C2C]/55">統計標準: Page Views / Day</span>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="relative w-full h-[180px] mt-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#E5E4DE" strokeDasharray="3 3" />
              <line x1={paddingX} y1={(chartHeight - paddingY) / 2} x2={chartWidth - paddingX} y2={(chartHeight - paddingY) / 2} stroke="#E5E4DE" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#E5E4DE" strokeWidth="0.5" />

              {/* Chart Gradients Area */}
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7D8471" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7D8471" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Draw area filled */}
              <polygon points={getAreaCoordinates()} fill="url(#chart-glow)" />

              {/* Draw line */}
              <polyline
                fill="none"
                stroke="#7D8471"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getCoordinates()}
              />

              {/* Interaction points & Hover handler */}
              {dailyTrend.map((item, index) => {
                const x = paddingX + (index * (chartWidth - paddingX * 2)) / (dailyTrend.length - 1);
                const y = chartHeight - paddingY - (item.views * (chartHeight - paddingY * 2)) / maxViews;
                const isActive = activeDateIndex === index;

                return (
                  <g key={index} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? "6" : "3.5"}
                      fill={isActive ? "#2C2C2C" : "#F9F8F6"}
                      stroke="#7D8471"
                      strokeWidth={isActive ? "2.5" : "1.5"}
                      onMouseEnter={() => setActiveDateIndex(index)}
                      onMouseLeave={() => setActiveDateIndex(null)}
                    />
                    
                    {/* Y-axis values on hover/point */}
                    {isActive && (
                      <g>
                        <rect
                          x={x - 45}
                          y={y - 32}
                          width="90"
                          height="22"
                          rx="4"
                          fill="#2C2C2C"
                        />
                        <text
                          x={x}
                          y={y - 18}
                          fill="#F9F8F6"
                          fontSize="9"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          瀏覽:{item.views} | 讚:{item.likes}
                        </text>
                        <line x1={x} y1={y} x2={x} y2={chartHeight - paddingY} stroke="#2C2C2C" strokeWidth="1" strokeDasharray="2 2" />
                      </g>
                    )}

                    {/* X-axis labels */}
                    <text
                      x={x}
                      y={chartHeight - 4}
                      fill="#2C2C2C"
                      fillOpacity="0.6"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {formatDateDay(item.date)}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis labeling bounds */}
              <text x={paddingX - 10} y={paddingY + 4} fill="#2C2C2C" fillOpacity="0.6" fontSize="8" textAnchor="end" fontFamily="monospace">
                {maxViews}
              </text>
              <text x={paddingX - 10} y={(chartHeight - paddingY) / 2 + 3} fill="#2C2C2C" fillOpacity="0.6" fontSize="8" textAnchor="end" fontFamily="monospace">
                {Math.floor(maxViews / 2)}
              </text>
              <text x={paddingX - 10} y={chartHeight - paddingY + 3} fill="#2C2C2C" fillOpacity="0.6" fontSize="8" textAnchor="end" fontFamily="monospace">
                0
              </text>
            </svg>
          </div>

          <p className="text-[11px] text-[#2C2C2C]/60 mt-4 flex items-center justify-center space-x-1">
            <span>💡 提示：將滑鼠游標停留在</span>
            <span className="font-bold underline text-[#2C2C2C]">節點</span>
            <span>上可檢索單日詳細數據日誌</span>
          </p>
        </div>

        {/* Traffic Sources & Device Breakdown */}
        <div className="bg-white border border-[#E5E4DE] rounded-3xl p-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 border-b border-[#E5E4DE] pb-3">
            <Compass className="w-4 h-4 text-[#7D8471]" />
            <h3 className="font-serif text-sm font-semibold text-[#2C2C2C]">流量來源通道 (TOP 5)</h3>
          </div>

          <div className="space-y-3.5 my-3">
            {referrerDistribution.length === 0 ? (
              <p className="text-xs text-[#2C2C2C]/55 italic">暫無流量來源數據</p>
            ) : (
              referrerDistribution.map((item, id) => {
                const percent = Math.round((item.value / totalReferrals) * 100);
                const colors = ["bg-[#7D8471]", "bg-[#A39B8F]", "bg-[#2C2C2C]/60", "bg-[#7D8471]/70", "bg-[#C9C8C0]"];
                const colorClass = colors[id % colors.length];

                return (
                  <div key={id} className="space-y-1">
                    <div className="flex justify-between text-xs text-[#2C2C2C]">
                      <span className="font-serif truncate max-w-[150px]">{item.name}</span>
                      <span className="font-mono text-[11px] text-[#2C2C2C]/60">
                        {item.value} 次 ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F4F3EE] rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Device Type Distribution */}
          <div className="mt-6 border-t border-[#E5E4DE] pt-4">
            <h4 className="text-xs font-semibold tracking-wider text-[#2C2C2C]/50 uppercase mb-3 text-center">
              使用裝置光譜
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              {deviceDistribution.map((item, index) => {
                const percent = Math.round((item.value / totalDeviceViews) * 100);
                const getDeviceIcon = (name: string) => {
                  switch (name.toLowerCase()) {
                    case "desktop": return <Laptop className="w-5 h-5 mx-auto mb-1 text-[#7D8471]" />;
                    case "tablet": return <Tablet className="w-5 h-5 mx-auto mb-1 text-[#7D8471]/80" />;
                    default: return <Smartphone className="w-5 h-5 mx-auto mb-1 text-[#7D8471]/60" />;
                  }
                };

                const getDeviceNameZh = (name: string) => {
                  switch (name.toLowerCase()) {
                    case "desktop": return "電腦桌機";
                    case "tablet": return "平板端";
                    default: return "行動手機";
                  }
                };

                return (
                  <div key={index} className="p-2 bg-[#F4F3EE]/80 rounded-2xl border border-[#E5E4DE]/40 hover:bg-[#F4F3EE] transition-all">
                    {getDeviceIcon(item.name)}
                    <h5 className="text-[10px] text-[#2C2C2C]/60">{getDeviceNameZh(item.name)}</h5>
                    <p className="font-mono text-xs font-bold text-[#2C2C2C] mt-0.5">{percent}%</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 3. POPULAR COMPOSITIONS LIST & RANKINGS */}
      <div className="bg-white border border-[#E5E4DE] rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-[#E5E4DE] pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-[#7D8471]" />
            <h3 className="font-serif text-sm font-semibold text-[#2C2C2C]">藝文作品受歡迎度排名 (TOP 5)</h3>
          </div>
          <span className="text-xs font-semibold text-[#7D8471] tracking-widest uppercase">最受喜愛排行</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E4DE] text-[#2C2C2C]/60 uppercase font-semibold">
                <th className="py-2.5">名次</th>
                <th className="py-2.5">作品名稱</th>
                <th className="py-2.5 text-center">閱覽數量 (Views)</th>
                <th className="py-2.5 text-center">點讚支持 (Likes)</th>
                <th className="py-2.5 text-center">留言討論 (Comments)</th>
                <th className="py-2.5 text-right">受歡迎熱度比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DE]/40">
              {popularItems.map((item, index) => {
                const totalMetrics = item.views + item.likes * 3 + item.commentsCount * 5;
                const maxMetrics = Math.max(...popularItems.map(p => p.views + p.likes * 3 + p.commentsCount * 5), 10);
                const heatPercent = Math.min(100, Math.round((totalMetrics / maxMetrics) * 100));

                return (
                  <tr key={item.id} className="hover:bg-[#F4F3EE]/30 transition-all text-[#2C2C2C]">
                    <td className="py-3 font-serif font-bold text-sm text-[#7D8471] w-12">
                      0{index + 1}
                    </td>
                    <td className="py-3 font-serif max-w-[280px] break-all truncate font-medium">
                      {item.title}
                    </td>
                    <td className="py-3 text-center font-mono">
                      {item.views}
                    </td>
                    <td className="py-3 text-center font-mono text-[#7D8471]">
                      {item.likes}
                    </td>
                    <td className="py-3 text-center font-mono text-[#7D8471]">
                      {item.commentsCount}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-mono text-[10px] text-[#2C2C2C]/60">{heatPercent}%</span>
                        <div className="w-16 h-1.5 bg-[#F4F3EE] rounded-full overflow-hidden">
                          <div className="h-full bg-[#7D8471]" style={{ width: `${heatPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
