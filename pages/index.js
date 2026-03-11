import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const C = {
  bg: "#f1f5f9", card: "#ffffff", card2: "#f8fafc",
  border: "#e2e8f0", borderLight: "#cbd5e1",
  text: "#0f172a", muted: "#64748b",
  paid: "#059669", unpaid: "#e11d48",
  accent: "#2563eb",
  warning: "#d97706",
};
const BCOLS = ["#2563eb", "#7c3aed", "#059669", "#ea580c", "#db2777", "#0891b2"];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState("כל המתחם");
  const [filterPaid, setFilterPaid] = useState("הכל");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה בטעינה");
      setData(json.data);
      setUpdatedAt(new Date(json.updatedAt).toLocaleString("he-IL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // רענון אוטומטי כל 5 דקות
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const buildings = ["כל המתחם", ...Array.from(new Set(data.map(d => d.building))).sort((a, b) => a.localeCompare(b, "he"))];

  const filteredData = data
    .filter(d => selectedBuilding === "כל המתחם" || d.building === selectedBuilding)
    .filter(d => filterPaid === "הכל" || (filterPaid === "שולם" ? d.paid : !d.paid));

  const totalPaid = data.filter(d => d.paid).length;
  const totalUnpaid = data.length - totalPaid;
  const totalPct = data.length ? Math.round((totalPaid / data.length) * 100) : 0;
  const pctColor = p => p >= 75 ? C.paid : p >= 40 ? C.warning : C.unpaid;

  const buildingStats = buildings.slice(1).map((b, i) => {
    const units = data.filter(d => d.building === b);
    const paid = units.filter(u => u.paid).length;
    return {
      name: b,
      "שולם": paid,
      "לא שולם": units.length - paid,
      pct: units.length ? Math.round((paid / units.length) * 100) : 0,
      total: units.length,
      color: BCOLS[i % BCOLS.length],
    };
  });

  const pieData = [
    { name: "שולם", value: totalPaid },
    { name: "לא שולם", value: totalUnpaid },
  ];

  const btn = (active, color, onClick, label) => (
    <button onClick={onClick} style={{
      background: active ? color : C.card2,
      color: active ? "#fff" : C.muted,
      border: `1px solid ${active ? color : C.border}`,
      borderRadius: 8, padding: "6px 14px", fontSize: 12,
      cursor: "pointer", transition: "all 0.15s",
    }}>{label}</button>
  );

  return (
    <>
      <Head>
        <title>מצב תשלומים — חוב בראן</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="דשבורד מצב תשלומים דיירי המתחם לחוב בראן" />
      </Head>

      <div style={{
        minHeight: "100vh", background: C.bg, color: C.text,
        fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
        direction: "rtl", padding: "20px 16px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                🏢 מצב תשלומים — חוב בראן
              </h1>
              <p style={{ color: C.muted, margin: "3px 0 0", fontSize: 12 }}>
                {loading ? "טוען..." : error ? "שגיאה בטעינה" : `${data.length} דירות • עודכן: ${updatedAt}`}
              </p>
            </div>
            <button onClick={fetchData} disabled={loading} style={{
              background: C.card2, color: C.text, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 16px", cursor: loading ? "default" : "pointer",
              fontSize: 13, opacity: loading ? 0.6 : 1,
            }}>
              🔄 רענן
            </button>
          </div>

          {error && (
            <div style={{ background: "#7f1d1d44", border: "1px solid #ef4444", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: C.muted, fontSize: 18 }}>⏳ טוען נתונים...</div>
          ) : (
            <>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'סה"כ דירות', value: data.length, color: C.accent },
                  { label: "שולם", value: totalPaid, color: C.paid },
                  { label: "לא שולם", value: totalUnpaid, color: C.unpaid },
                  { label: "אחוז גבייה", value: `${totalPct}%`, color: pctColor(totalPct) },
                ].map(k => (
                  <div key={k.label} style={{
                    background: C.card, borderRadius: 12, padding: "14px 16px",
                    border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}`,
                  }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts + Building cards */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, marginBottom: 20 }}>

                {/* Donut - כלל המתחם */}
                <div style={{ background: C.card, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>כלל המתחם</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72}
                        dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                        <Cell fill={C.paid} /><Cell fill={C.unpaid} />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ textAlign: "center", marginTop: -4 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: pctColor(totalPct) }}>{totalPct}%</span>
                    <div style={{ fontSize: 11, color: C.muted }}>שולם</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 8, fontSize: 11 }}>
                    <span style={{ color: C.paid }}>● שולם</span>
                    <span style={{ color: C.unpaid }}>● לא שולם</span>
                  </div>
                </div>

                {/* Building cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12 }}>
                  {buildingStats.map(b => {
                    const isSelected = selectedBuilding === b.name;
                    const miniPie = [{ value: b["שולם"] }, { value: b["לא שולם"] }];
                    return (
                      <div key={b.name}
                        onClick={() => setSelectedBuilding(isSelected ? "כל המתחם" : b.name)}
                        style={{
                          background: C.card,
                          border: `2px solid ${isSelected ? b.color : C.border}`,
                          borderRadius: 16,
                          padding: "16px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: isSelected
                            ? `0 4px 20px ${b.color}33`
                            : "0 1px 4px rgba(0,0,0,0.06)",
                        }}>

                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 800, color: b.color,
                            background: b.color + "18", borderRadius: 8,
                            padding: "3px 10px",
                          }}>{b.name}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{b.total} דירות</div>
                        </div>

                        {/* Mini pie + big % */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 64, height: 64, flexShrink: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={miniPie} cx="50%" cy="50%"
                                  innerRadius={20} outerRadius={30}
                                  dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                                  <Cell fill={pctColor(b.pct)} />
                                  <Cell fill={C.border} />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: pctColor(b.pct), lineHeight: 1 }}>{b.pct}%</div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>שיעור גבייה</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: 5, background: C.border, borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 4,
                            width: `${b.pct}%`,
                            background: pctColor(b.pct),
                            transition: "width 0.5s ease",
                          }} />
                        </div>

                        {/* Numbers row */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.paid }}>{b["שולם"]}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>שילמו</div>
                          </div>
                          <div style={{ width: 1, background: C.border }} />
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.unpaid }}>{b["לא שולם"]}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>לא שילמו</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                {buildings.map(b => btn(selectedBuilding === b, C.accent, () => setSelectedBuilding(b), b))}
                <div style={{ width: 1, height: 22, background: C.border, margin: "0 2px" }} />
                {btn(filterPaid === "הכל", "#475569", () => setFilterPaid("הכל"), "הכל")}
                {btn(filterPaid === "שולם", C.paid, () => setFilterPaid("שולם"), "✓ שולם")}
                {btn(filterPaid === "לא שולם", C.unpaid, () => setFilterPaid("לא שולם"), "✗ לא שולם")}
              </div>

              {/* Table */}
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: `1px solid ${C.border}` }}>
                      {["בניין", "מס׳ דירה", "סטטוס"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "right", color: C.muted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}18`, background: i % 2 === 0 ? "transparent" : "#f8fafc" }}>
                        <td style={{ padding: "9px 16px", color: C.muted }}>{row.building}</td>
                        <td style={{ padding: "9px 16px", fontWeight: 700, fontSize: 14 }}>{row.apartment}</td>
                        <td style={{ padding: "9px 16px" }}>
                          <span style={{
                            background: row.paid ? "#10b98118" : "#f43f5e18",
                            color: row.paid ? C.paid : C.unpaid,
                            border: `1px solid ${row.paid ? C.paid + "44" : C.unpaid + "44"}`,
                            borderRadius: 20, padding: "2px 11px", fontSize: 11, fontWeight: 700,
                          }}>
                            {row.paid ? "✓ שולם" : "✗ לא שולם"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "9px 16px", color: C.muted, fontSize: 11, borderTop: `1px solid ${C.border}` }}>
                  מוצגות {filteredData.length} דירות מתוך {data.length}
                </div>
              </div>

              <div style={{ marginTop: 16, textAlign: "center", color: C.muted, fontSize: 11 }}>
                הנתונים מתרעננים אוטומטית כל 5 דקות
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
