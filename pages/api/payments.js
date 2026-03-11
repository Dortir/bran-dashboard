// pages/api/payments.js
// רץ בצד השרת בלבד — ה-API Key לעולם לא נחשף לדפדפן

export default async function handler(req, res) {
  const SHEET_ID = "1DxztP3ja_HIyy2VU4A4mVljbncSpkGVFm0lO8O2VxWo";
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const RANGE = "Sheet1";

  if (!API_KEY) {
    return res.status(500).json({ error: "API Key לא מוגדר" });
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || "שגיאה מ-Google" });
    }

    const json = await response.json();
    const rows = json.values || [];

    if (rows.length < 2) {
      return res.status(200).json({ data: [], updatedAt: new Date().toISOString() });
    }

    // מבנה הגיליון: שורה 0 = שמות בניינים, שורה 1 = לא שולם/שולם, שורות 2+ = מספרי דירות
    const buildingRow = rows[0];
    const data = [];

    // מצא עמודות התחלה של כל בניין
    const buildingCols = [];
    buildingRow.forEach((val, i) => {
      if (val && val.trim()) buildingCols.push([i, val.trim()]);
    });

    for (const [colIdx, bname] of buildingCols) {
      const unpaidCol = colIdx;
      const paidCol = colIdx + 1;
      for (let r = 2; r < rows.length; r++) {
        const row = rows[r] || [];
        if (unpaidCol < row.length && row[unpaidCol]?.trim()) {
          data.push({ building: bname, apartment: row[unpaidCol].trim(), paid: false });
        }
        if (paidCol < row.length && row[paidCol]?.trim()) {
          data.push({ building: bname, apartment: row[paidCol].trim(), paid: true });
        }
      }
    }

    // מיון לפי בניין ומספר דירה
    data.sort((a, b) =>
      a.building.localeCompare(b.building, "he") ||
      (parseInt(a.apartment) || 0) - (parseInt(b.apartment) || 0)
    );

    // cache קצר — 5 דקות
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({ data, updatedAt: new Date().toISOString() });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
