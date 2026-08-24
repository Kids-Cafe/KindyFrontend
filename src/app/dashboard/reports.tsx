import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Smile, Meh, Frown, MessageCircleHeart } from "lucide-react";
import type {
  ChildReports,
  FoodReportData,
  FriendshipReportData,
  HealthReportData,
  LearningReportData,
  PersonalityReportData,
  ReportCategory,
  ReportData,
} from "@/app/dashboard/types";
import { REPORT_META } from "@/app/dashboard/reportMeta";

const STATUS_ICON = { good: Smile, mild: Meh, bad: Frown } as const;
const STATUS_COLOR = { good: "#86EFAC", mild: "#F9D56E", bad: "#F472B6" } as const;

/** 카드형 섹션 래퍼입니다. 모든 리포트 화면이 동일한 여백/헤더 규칙을 따르도록 통일합니다. */
function ReportSection({ category, children }: { category: ReportCategory; children: React.ReactNode }) {
  const meta = REPORT_META[category];
  return (
    <div className="rounded-2xl bg-card border p-5" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}26` }}>
          <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
        </span>
        <h3 className="text-sm font-bold" style={{ color: "#3B1355" }}>{meta.label}</h3>
      </div>
      {children}
    </div>
  );
}

export function FoodReport({ data }: { data: ChildReports["food"] }) {
  return (
    <ReportSection category="food">
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data.weekly} barCategoryGap="28%">
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#A06080" }} />
          <YAxis hide />
          <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(232,121,160,0.2)", fontSize: 12 }} cursor={{ fill: "rgba(232,121,160,0.06)" }} />
          <Bar dataKey="vegetable" name="채소" stackId="a" fill="#86EFAC" radius={[0, 0, 0, 0]} />
          <Bar dataKey="protein" name="단백질" stackId="a" fill="#7ECECA" />
          <Bar dataKey="carbs" name="탄수화물" stackId="a" fill="#F9D56E" />
          <Bar dataKey="dairy" name="유제품" stackId="a" fill="#F472B6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs leading-relaxed mt-2" style={{ color: "#6B3580" }}>{data.balanceNote}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {data.favorite.map((f) => (
          <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#DCFCE7", color: "#166534" }}>👍 {f}</span>
        ))}
        {data.caution.map((f) => (
          <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>⚠️ {f}</span>
        ))}
      </div>
    </ReportSection>
  );
}

export function HealthReport({ data }: { data: ChildReports["health"] }) {
  return (
    <ReportSection category="health">
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-xs" style={{ color: "#A06080" }}>키</p>
          <p className="text-lg font-bold" style={{ color: "#3B1355" }}>{data.heightCm}cm</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "#A06080" }}>몸무게</p>
          <p className="text-lg font-bold" style={{ color: "#3B1355" }}>{data.weightKg}kg</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.timeline.map((entry) => {
          const Icon = STATUS_ICON[entry.status];
          return (
            <div key={entry.date} className="flex items-center gap-3 text-xs">
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${STATUS_COLOR[entry.status]}30` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: STATUS_COLOR[entry.status] }} />
              </span>
              <span className="font-bold w-14 shrink-0" style={{ color: "#3B1355" }}>{entry.date}</span>
              <span style={{ color: "#6B3580" }}>{entry.note}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed mt-3" style={{ color: "#6B3580" }}>{data.note}</p>
    </ReportSection>
  );
}

export function FriendshipReport({ data }: { data: ChildReports["friendship"] }) {
  return (
    <ReportSection category="friendship">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircleHeart className="w-4 h-4" style={{ color: "#C084FC" }} />
        <span className="text-xs font-bold" style={{ color: "#3B1355" }}>사회성 점수 {data.sociabilityScore}점</span>
      </div>
      <div className="space-y-2.5">
        {data.closest.map((f) => (
          <div key={f.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold" style={{ color: "#3B1355" }}>{f.name}</span>
              <span style={{ color: "#A06080" }}>{f.strength}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${f.strength}%`, background: "#C084FC" }} />
            </div>
            <p className="text-xs mt-1" style={{ color: "#A06080" }}>{f.note}</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed mt-3" style={{ color: "#6B3580" }}>{data.groupNote}</p>
    </ReportSection>
  );
}

export function PersonalityReport({ data }: { data: ChildReports["personality"] }) {
  return (
    <ReportSection category="personality">
      <ResponsiveContainer width="100%" height={190}>
        <RadarChart data={data.traits}>
          <PolarGrid stroke="rgba(232,121,160,0.18)" />
          <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: "#A06080" }} />
          <PolarRadiusAxis domain={[0, 100]} hide />
          <Radar dataKey="value" stroke="#F9D56E" fill="#F9D56E" fillOpacity={0.28} strokeWidth={2} dot={{ fill: "#F9D56E", r: 4 }} />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs font-bold mt-1" style={{ color: "#E879A0" }}>{data.mbtiLike}</p>
      <p className="text-xs leading-relaxed mt-1" style={{ color: "#6B3580" }}>{data.summary}</p>
    </ReportSection>
  );
}

export function LearningReport({ data }: { data: ChildReports["learning"] }) {
  return (
    <ReportSection category="learning">
      <div className="space-y-2.5">
        {data.subjects.map((s) => (
          <div key={s.subject}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold" style={{ color: "#3B1355" }}>{s.subject}</span>
              <span style={{ color: "#A06080" }}>{s.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: "#7ECECA" }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: "#A06080" }}>최근 관심 주제: <span className="font-bold" style={{ color: "#3B1355" }}>{data.recentTopic}</span></p>
      <p className="text-xs leading-relaxed mt-1" style={{ color: "#6B3580" }}>{data.interestNote}</p>
    </ReportSection>
  );
}

/**
 * 리포트 본문 하나를 그 카테고리에 맞는 컴포넌트로 그립니다.
 *
 * 리포트 한 판만 들고 있는 곳을 위한 입구입니다 — 채팅 데이터 카드는 아이의 **현재**
 * 리포트 묶음이 아니라 그 카드가 보낼 당시의 리포트를 그려야 하므로, `ChildReports` 전체를
 * 받을 수가 없습니다.
 *
 * `data`가 카테고리와 맞는지는 타입이 잡아 주지 못합니다(다섯 본문의 합집합이라서). 카드의
 * 경우 서버가 못박은 `reportId`의 카테고리가 곧 `type`이므로 둘이 어긋나지 않습니다 —
 * ChatMessageTypeTest가 그 짝을 지킵니다.
 */
export function ReportByCategoryData({ category, data }: { category: ReportCategory; data: ReportData }) {
  switch (category) {
    case "food": return <FoodReport data={data as FoodReportData} />;
    case "health": return <HealthReport data={data as HealthReportData} />;
    case "friendship": return <FriendshipReport data={data as FriendshipReportData} />;
    case "personality": return <PersonalityReport data={data as PersonalityReportData} />;
    case "learning": return <LearningReport data={data as LearningReportData} />;
  }
}

/** 카테고리 이름만으로 알맞은 리포트 컴포넌트를 그려주는 헬퍼입니다. 학생 정보창/성장 리포트 화면에서 재사용합니다. */
export function ReportByCategory({ category, reports }: { category: ReportCategory; reports: ChildReports }) {
  return <ReportByCategoryData category={category} data={reports[category]} />;
}
