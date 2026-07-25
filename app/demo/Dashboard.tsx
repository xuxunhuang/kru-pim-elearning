"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type State = "active" | "upcoming" | "expired";
type Course = { id: number; title: string; subtitle: string; state: State; progress: number; lessons: number; accent: string; date: string };

const courses: Course[] = [
  { id: 1, title: "คณิตศาสตร์พื้นฐาน", subtitle: "เตรียมความพร้อมก่อนขึ้นชั้นใหม่", state: "active", progress: 68, lessons: 12, accent: "rose", date: "ถึง 30 ก.ย. 2569 · 23:59" },
  { id: 2, title: "ตะลุยโจทย์สมการ", subtitle: "ฝึกคิดเป็นขั้นตอน พร้อมเทคนิคจับเวลา", state: "active", progress: 24, lessons: 8, accent: "violet", date: "ถึง 15 ต.ค. 2569 · 20:00" },
  { id: 3, title: "เรขาคณิตฉบับเข้าใจง่าย", subtitle: "ภาพ เส้น และมุม ที่ไม่ต้องท่องจำ", state: "upcoming", progress: 0, lessons: 10, accent: "peach", date: "เปิด 1 ส.ค. 2569 · 09:00" },
  { id: 4, title: "ทบทวนก่อนสอบกลางภาค", subtitle: "สรุปเนื้อหาและโจทย์สำคัญ", state: "expired", progress: 100, lessons: 6, accent: "lilac", date: "หมดอายุแล้ว" }
];

const tabs: { key: "all" | State; label: string }[] = [
  { key: "all", label: "ทั้งหมด" }, { key: "active", label: "กำลังเรียน" },
  { key: "upcoming", label: "ยังไม่เปิด" }, { key: "expired", label: "หมดอายุ" }
];

export function Dashboard() {
  const [tab, setTab] = useState<"all" | State>("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => courses.filter((course) => {
    const matchesTab = tab === "all" || tab === course.state;
    return matchesTab && `${course.title} ${course.subtitle}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [query, tab]);

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <Link className="wordmark" href="/"><span className="wordmark-icon">KP</span><b>Kru Pim <small>E-learning</small></b></Link>
        <div className="top-actions">
          <label className="search-field"><span>⌕</span><span className="sr-only">ค้นหาคอร์สหรือคลิป</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาคอร์สหรือคลิป" /></label>
          <button className="profile-button" type="button"><span>พพ</span><b>พิมพ์ชนก<small>นักเรียน</small></b><i>⌄</i></button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="welcome-card">
          <div className="welcome-copy">
            <span className="soft-label">สวัสดีตอนบ่าย ✦</span>
            <h1>พร้อมเรียนต่อแล้วหรือยัง?</h1>
            <p>วันนี้เรามาต่อจากบทเรียนล่าสุดกันนะ เก่งขึ้นอีกนิดในทุกวัน</p>
            <button className="primary-button" type="button">เรียนต่อจากครั้งล่าสุด <span>→</span></button>
          </div>
          <Image className="welcome-mascot" src="/kru-pim-mascot.png" alt="" width={360} height={360} />
          <div className="welcome-stat"><strong>68%</strong><span>คอร์สล่าสุด</span></div>
        </section>

        <div className="section-heading"><div><span className="eyebrow">คอร์สของฉัน</span><h2>เลือกบทเรียนที่อยากเรียน</h2></div><span>{filtered.length} คอร์ส</span></div>
        <div className="filter-row" role="tablist">
          {tabs.map((item) => <button key={item.key} role="tab" aria-selected={tab === item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>{item.label}<span>{item.key === "all" ? courses.length : courses.filter((c) => c.state === item.key).length}</span></button>)}
        </div>

        {filtered.length ? <div className="course-grid">
          {filtered.map((course) => <article className="course-card" key={course.id}>
            <div className={`course-cover ${course.accent}`}>
              <span className="subject-icon">{course.state === "upcoming" ? "△" : course.state === "expired" ? "✓" : "π"}</span>
              <span className={`status-pill ${course.state}`}>{course.state === "active" ? "กำลังเรียน" : course.state === "upcoming" ? "ยังไม่เปิด" : "หมดอายุ"}</span>
            </div>
            <div className="course-body">
              <p className="course-meta">{course.lessons} บทเรียน</p><h3>{course.title}</h3><p>{course.subtitle}</p>
              {course.state === "active" && <div className="progress-block"><div><span>ความคืบหน้า</span><strong>{course.progress}%</strong></div><div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div></div>}
              <div className="course-footer"><span>{course.date}</span><button type="button" disabled={course.state !== "active"}>{course.state === "active" ? "เข้าเรียน" : course.state === "upcoming" ? "รอเปิด" : "ดูข้อมูล"}</button></div>
            </div>
          </article>)}
        </div> : <div className="empty-state"><b>♡</b><h3>ยังไม่พบคอร์สที่ค้นหา</h3><p>ลองใช้คำค้นอื่น หรือเลือกดูคอร์สทั้งหมดนะ</p><button onClick={() => { setQuery(""); setTab("all"); }}>ดูคอร์สทั้งหมด</button></div>}
      </div>

      <div className="demo-watermark" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <span key={i}>พิมพ์ชนก · pim***@gmail.com · ตัวอย่าง</span>)}</div>
    </main>
  );
}
