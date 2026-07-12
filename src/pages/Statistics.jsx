import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Eye, Send, MessageSquare, TrendingUp } from "lucide-react";

const viewsData = [
  { month: "Yan", views: 45 }, { month: "Fev", views: 78 }, { month: "Mar", views: 120 },
  { month: "Apr", views: 95 }, { month: "May", views: 145 }, { month: "Iyun", views: 180 },
  { month: "Iyul", views: 210 },
];

const applicationsData = [
  { month: "Yan", count: 3 }, { month: "Fev", count: 5 }, { month: "Mar", count: 8 },
  { month: "Apr", count: 6 }, { month: "May", count: 12 }, { month: "Iyun", count: 9 },
  { month: "Iyul", count: 7 },
];

const statusData = [
  { name: "Yuborildi", value: 12, color: "#C7C7CE" },
  { name: "Ko'rildi", value: 8, color: "#3730A3" },
  { name: "Intervyu", value: 4, color: "#0A0A0B" },
  { name: "Qabul qilindi", value: 2, color: "#15803D" },
  { name: "Rad etildi", value: 3, color: "#B91C1C" },
];

export default function Statistics() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">Statistika</h1>
        <p className="text-ink-3 text-sm">Profilingiz ko'rsatkichlari</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Profil ko'rishlar", value: "873", change: "+12%", icon: Eye },
          { label: "Yuborilgan arizalar", value: "29", change: "+3", icon: Send },
          { label: "Javob olish foizi", value: "62%", change: "+5%", icon: MessageSquare },
          { label: "Intervyu takliflari", value: "8", change: "+2", icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5">
            <stat.icon className="w-4 h-4 text-ink-3 mb-4" strokeWidth={1.75} />
            <div className="text-2xl font-semibold text-ink tracking-tight">{stat.value}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-ink-3">{stat.label}</span>
              <span className="text-xs font-medium text-success">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Views chart */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-ink text-sm mb-6">Profil ko'rishlar (oylik)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#0A0A0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #E7E7EA", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Area type="monotone" dataKey="views" stroke="#0A0A0B" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications chart */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-ink text-sm mb-6">Yuborilgan arizalar (oylik)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #E7E7EA", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="count" fill="#3730A3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Status pie chart */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-ink text-sm mb-6">Ariza holatlari</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-ink-2">{s.name}</span>
                <span className="font-medium text-ink">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response rate */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-ink text-sm mb-6">Javob olish</h2>
          <div className="text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F0F0F1" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#3730A3" strokeWidth="8"
                  strokeDasharray="314" strokeDashoffset={314 - (314 * 62) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold text-ink">62%</span>
              </div>
            </div>
            <p className="text-sm text-ink-3">Arizalaringizga javob berish foizi</p>
            <p className="text-xs text-ink-3 mt-1">O'rtachadan yuqori</p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-ink rounded-xl p-6 text-white">
          <h2 className="font-semibold text-sm mb-4">Maslahatlar</h2>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
              Profilingizni to'liqroq to'ldiring — bu javob olish foizini oshiradi
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
              Har haftada kamida 3 ta ariza yuboring
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
              Verifikatsiyadan o'ting — ishonchni oshiradi
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
              Portfolio havolalarini qo'shing
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
