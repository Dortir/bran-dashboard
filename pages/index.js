import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const C = {
  bg: "#f1f5f9", card: "#ffffff", card2: "#f8fafc",
  border: "#e2e8f0", text: "#0f172a", muted: "#64748b",
  paid: "#059669", unpaid: "#e11d48",
  accent: "#2563eb", warning: "#d97706",
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
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/payments");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה בטעינה");
      setData(json.data);
      setUpdatedAt(new Date(json.updatedAt).toLocaleString("he-IL", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(iv);
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
    return { name: b, paid, unpaid: units.length - paid, pct: units.length ? Math.round((paid / units.length) * 100) : 0, total: units.length, color: BCOLS[i % BCOLS.length] };
  });

  const pieData = [{ value: totalPaid }, { value: totalUnpaid }];

  const btn = (active, color, onClick, label) => (
    <button onClick={onClick} style={{
      background: active ? color : C.card2, color: active ? "#fff" : C.muted,
      border: `1px solid ${active ? color : C.border}`,
      borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
    }}>{label}</button>
  );

  return (
    <>
      <Head>
        <title>מצב תשלומים — חוב בראן</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; direction: rtl; font-family: 'Segoe UI','Arial Hebrew',Arial,sans-serif; }
        .wrap { max-width: 1200px; margin: 0 auto; padding: 20px 16px; }
        .kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: 210px 1fr; gap: 16px; margin-bottom: 20px; align-items: start; }
        .bldg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(185px,1fr)); gap: 12px; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
        .bcard { transition: transform 0.15s, box-shadow 0.15s; }
        .bcard:hover { transform: translateY(-2px); }
        @media(max-width:768px) {
          .kpis { grid-template-columns: repeat(2,1fr); }
          .summary { grid-template-columns: 1fr; }
          .bldg-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media(max-width:400px) {
          .bldg-grid { grid-template-columns: 1fr; }
        }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { padding:10px 16px; text-align:right; color:${C.muted}; font-weight:600; font-size:12px; background:#f1f5f9; }
        td { padding:9px 16px; }
        tr { border-bottom: 1px solid ${C.border}; }
        @media(max-width:480px) { th,td { padding:8px 10px; font-size:12px; } }
      `}</style>

      <div style={{ minHeight: "100vh" }}>
        <div className="wrap">

          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>🏢 מצב תשלומים — חוב בראן</h1>
              <p style={{ color:C.muted, marginTop:3, fontSize:12 }}>
                {loading ? "טוען..." : error ? "שגיאה" : `${data.length} דירות • עודכן: ${updatedAt}`}
              </p>
            </div>
            <button onClick={fetchData} disabled={loading} style={{
              background:C.card, color:C.text, border:`1px solid ${C.border}`,
              borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, opacity:loading?0.6:1,
            }}>🔄 רענן</button>
          </div>

          {error && (
            <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#991b1b" }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:"center", padding:80, color:C.muted, fontSize:18 }}>⏳ טוען נתונים...</div>
          ) : (
            <>
              {/* KPIs */}
              <div className="kpis">
                {[
                  { label:'סה"כ דירות', value:data.length, color:C.accent },
                  { label:"שולם", value:totalPaid, color:C.paid },
                  { label:"לא שולם", value:totalUnpaid, color:C.unpaid },
                  { label:"אחוז גבייה", value:`${totalPct}%`, color:pctColor(totalPct) },
                ].map(k => (
                  <div key={k.label} style={{
                    background:C.card, borderRadius:12, padding:"14px 16px",
                    border:`1px solid ${C.border}`, borderTop:`3px solid ${k.color}`,
                    boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Summary: horizontal donut bar + building cards grid */}
              <div style={{ background:C.card, borderRadius:16, padding:"14px 20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", marginBottom:16, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                <div style={{ fontSize:14, fontWeight:700, whiteSpace:"nowrap" }}>כלל המתחם</div>
                <div style={{ width:80, height:80, flexShrink:0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={26} outerRadius={38}
                        dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                        <Cell fill={pctColor(totalPct)} /><Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                  <div style={{ fontSize:40, fontWeight:900, color:pctColor(totalPct), lineHeight:1 }}>{totalPct}%</div>
                  <div style={{ fontSize:12, color:C.muted }}>שיעור גבייה</div>
                </div>
                <div style={{ height:40, width:1, background:C.border, flexShrink:0 }} />
                <div style={{ display:"flex", gap:24 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:24, fontWeight:800, color:C.paid }}>{totalPaid}</div>
                    <div style={{ fontSize:11, color:C.muted }}>שילמו</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:24, fontWeight:800, color:C.unpaid }}>{totalUnpaid}</div>
                    <div style={{ fontSize:11, color:C.muted }}>לא שילמו</div>
                  </div>
                </div>
              </div>

              {/* Building cards */}
              <div className="bldg-grid" style={{ marginBottom:20 }}>
                  {buildingStats.map(b => {
                    const isSel = selectedBuilding === b.name;
                    const mp = [{ value: b.paid || 0.001 }, { value: b.unpaid }];
                    return (
                      <div key={b.name} className="bcard"
                        onClick={() => setSelectedBuilding(isSel ? "כל המתחם" : b.name)}
                        style={{
                          background:C.card,
                          border:`2px solid ${isSel ? b.color : C.border}`,
                          borderRadius:16, padding:16, cursor:"pointer",
                          boxShadow: isSel ? `0 4px 16px ${b.color}28` : "0 1px 3px rgba(0,0,0,0.05)",
                        }}>

                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:b.color, background:b.color+"15", borderRadius:8, padding:"3px 10px" }}>{b.name}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{b.total} דירות</div>
                        </div>

                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                          <div style={{ width:58, height:58, flexShrink:0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={mp} cx="50%" cy="50%" innerRadius={17} outerRadius={27}
                                  dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                                  <Cell fill={pctColor(b.pct)} /><Cell fill="#e2e8f0" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <div style={{ fontSize:26, fontWeight:900, color:pctColor(b.pct), lineHeight:1 }}>{b.pct}%</div>
                            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>שיעור גבייה</div>
                          </div>
                        </div>

                        <div style={{ height:5, background:"#e2e8f0", borderRadius:4, marginBottom:10, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:4, width:`${Math.max(b.pct,0)}%`, background:pctColor(b.pct) }} />
                        </div>

                        <div style={{ display:"flex", justifyContent:"space-around", textAlign:"center" }}>
                          <div>
                            <div style={{ fontSize:20, fontWeight:800, color:C.paid }}>{b.paid}</div>
                            <div style={{ fontSize:10, color:C.muted }}>שילמו</div>
                          </div>
                          <div style={{ width:1, background:C.border }} />
                          <div>
                            <div style={{ fontSize:20, fontWeight:800, color:C.unpaid }}>{b.unpaid}</div>
                            <div style={{ fontSize:10, color:C.muted }}>לא שילמו</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


              {/* Filters */}
              <div className="filters">
                {buildings.map(b => btn(selectedBuilding===b, C.accent, ()=>setSelectedBuilding(b), b))}
                <div style={{ width:1, height:20, background:C.border, margin:"0 2px" }} />
                {btn(filterPaid==="הכל","#64748b",()=>setFilterPaid("הכל"),"הכל")}
                {btn(filterPaid==="שולם",C.paid,()=>setFilterPaid("שולם"),"✓ שולם")}
                {btn(filterPaid==="לא שולם",C.unpaid,()=>setFilterPaid("לא שולם"),"✗ לא שולם")}
              </div>

              {/* Table */}
              <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                <table>
                  <thead><tr>{["בניין","מס׳ דירה","סטטוס"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredData.map((row,i)=>(
                      <tr key={i} style={{ background:i%2===0?"#fff":"#f8fafc" }}>
                        <td style={{ color:C.muted }}>{row.building}</td>
                        <td style={{ fontWeight:700, fontSize:14 }}>{row.apartment}</td>
                        <td>
                          <span style={{
                            background:row.paid?"#d1fae5":"#fee2e2",
                            color:row.paid?C.paid:C.unpaid,
                            border:`1px solid ${row.paid?"#6ee7b7":"#fca5a5"}`,
                            borderRadius:20, padding:"2px 11px", fontSize:11, fontWeight:700,
                          }}>
                            {row.paid?"✓ שולם":"✗ לא שולם"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding:"9px 16px", color:C.muted, fontSize:11, borderTop:`1px solid ${C.border}` }}>
                  מוצגות {filteredData.length} דירות מתוך {data.length}
                </div>
              </div>

              <div style={{ marginTop:14, textAlign:"center", color:C.muted, fontSize:11 }}>
                הנתונים מתרעננים אוטומטית כל 5 דקות
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
