import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  useListBranches,
  useListSubjects,
  useGetAttendanceReport,
  type AttendanceReport,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Printer, FileText, Users, CheckCircle2, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type DateMode = "single" | "month" | "range";

function openPrintWindow(report: AttendanceReport, dateLabel: string, facultyName: string) {
  const logoUrl = `${window.location.origin}/bti-logo.jpeg`;

  // For range/month reports group by date then by student
  const isMultiDate = new Set(report.records.map((r) => r.date)).size > 1;

  let tableHtml = "";
  if (isMultiDate) {
    // Group by student: show present/absent counts
    const studentMap = new Map<number, { name: string; code: string; present: number; absent: number }>();
    for (const r of report.records) {
      const existing = studentMap.get(r.studentId) ?? { name: r.studentName ?? "", code: r.studentCode ?? "", present: 0, absent: 0 };
      if (r.status === "present") existing.present++;
      else existing.absent++;
      studentMap.set(r.studentId, existing);
    }
    const students = Array.from(studentMap.values());
    tableHtml = `
      <thead><tr>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6">S.No</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6">USN / ID</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6">Student Name</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:center">Present</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:center">Absent</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:center">%</th>
      </tr></thead>
      <tbody>
        ${students.map((s, i) => {
          const total = s.present + s.absent;
          const pct = total > 0 ? ((s.present / total) * 100).toFixed(1) : "0.0";
          return `<tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
            <td style="border:1px solid #d1d5db;padding:6px 10px;color:#6b7280">${i + 1}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px;font-family:monospace;font-weight:600">${s.code}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px">${s.name}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px;text-align:center;color:#15803d;font-weight:700">${s.present}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px;text-align:center;color:#b91c1c;font-weight:700">${s.absent}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px;text-align:center;font-weight:700;color:${parseFloat(pct) >= 75 ? "#15803d" : "#b91c1c"}">${pct}%</td>
          </tr>`;
        }).join("")}
      </tbody>`;
  } else {
    tableHtml = `
      <thead><tr>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6">S.No</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6">USN / ID</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6">Student Name</th>
        <th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:center">Status</th>
      </tr></thead>
      <tbody>
        ${report.records.map((r, i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
            <td style="border:1px solid #d1d5db;padding:6px 10px;color:#6b7280">${i + 1}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px;font-family:monospace;font-weight:600">${r.studentCode ?? ""}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px">${r.studentName ?? ""}</td>
            <td style="border:1px solid #d1d5db;padding:6px 10px;text-align:center;font-weight:700;color:${r.status === "present" ? "#15803d" : "#b91c1c"}">${r.status === "present" ? "P" : "A"}</td>
          </tr>`).join("")}
      </tbody>`;
  }

  const pct = report.attendancePercentage.toFixed(1);
  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <title>Attendance Report – ${report.branchName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:32px}
    .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #1f2937;padding-bottom:16px;margin-bottom:16px}
    .header img{height:72px;object-fit:contain}
    .header h1{font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
    .header p{font-size:11px;color:#4b5563;margin-top:2px}
    .header h2{font-size:14px;font-weight:600;margin-top:8px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:16px;font-size:12px}
    .meta .label{font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
    .meta .val{font-weight:600;margin-top:2px}
    .stats{display:flex;gap:32px;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:16px}
    .stats .item{text-align:center}
    .stats .num{font-size:22px;font-weight:700}
    .stats .lbl{font-size:10px;color:#6b7280;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    .sigs{display:flex;justify-content:space-between;margin-top:64px;padding:0 16px}
    .sig{text-align:center;border-top:1px solid #1f2937;width:180px;padding-top:6px;font-size:12px;font-weight:600;color:#374151}
    .footer{font-size:10px;color:#9ca3af;text-align:right;margin-top:8px}
    @media print{body{padding:0}}
  </style>
</head>
<body onload="window.print();">
  <div class="header">
    <img src="${logoUrl}" alt="BTI Logo"/>
    <div>
      <h1>${report.collegeName}</h1>
      <p>Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
      <h2>Attendance Report</h2>
    </div>
  </div>
  <div class="meta">
    <div><div class="label">Branch</div><div class="val">${report.branchName}</div></div>
    <div><div class="label">Period</div><div class="val">${dateLabel}</div></div>
    <div><div class="label">Subject</div><div class="val">${report.subjectName} (${report.subjectCode})</div></div>
    <div><div class="label">Faculty</div><div class="val">${facultyName || "—"}</div></div>
  </div>
  <div class="stats">
    <div class="item"><div class="num">${report.totalStudents}</div><div class="lbl">Students</div></div>
    <div class="item"><div class="num" style="color:#15803d">${report.totalPresent}</div><div class="lbl">Present</div></div>
    <div class="item"><div class="num" style="color:#b91c1c">${report.totalAbsent}</div><div class="lbl">Absent</div></div>
    <div class="item"><div class="num" style="color:${report.attendancePercentage >= 75 ? "#15803d" : "#b91c1c"}">${pct}%</div><div class="lbl">Attendance</div></div>
  </div>
  <table>${tableHtml}</table>
  <div class="footer">Total records: ${report.records.length}</div>
  <div class="sigs">
    <div class="sig">Faculty Signature</div>
    <div class="sig">HOD Signature</div>
  </div>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) { alert("Please allow pop-ups for this site to enable printing."); return; }
  win.document.write(html);
  win.document.close();
}

export default function ReportPage() {
  const [branchId, setBranchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [mode, setMode] = useState<DateMode>("single");

  // Single day
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  // Month
  const [monthDate, setMonthDate] = useState<Date>(new Date());
  // Range
  const [rangeFrom, setRangeFrom] = useState<Date>(new Date());
  const [rangeTo, setRangeTo] = useState<Date>(new Date());

  const { data: branches } = useListBranches();
  const { data: subjects } = useListSubjects(
    { branchId: parseInt(branchId, 10) },
    { query: { enabled: !!branchId } }
  );

  // Build query params based on mode
  const queryParams = (() => {
    const base = {
      branchId: parseInt(branchId, 10),
      subjectId: parseInt(subjectId, 10),
      facultyName: facultyName || undefined,
    };
    if (mode === "single") return { ...base, date: format(singleDate, "yyyy-MM-dd") };
    if (mode === "month") return {
      ...base,
      startDate: format(startOfMonth(monthDate), "yyyy-MM-dd"),
      endDate: format(endOfMonth(monthDate), "yyyy-MM-dd"),
    };
    return {
      ...base,
      startDate: format(rangeFrom, "yyyy-MM-dd"),
      endDate: format(rangeTo, "yyyy-MM-dd"),
    };
  })();

  const dateLabel = (() => {
    if (mode === "single") return format(singleDate, "dd MMMM yyyy");
    if (mode === "month") return format(monthDate, "MMMM yyyy");
    return `${format(rangeFrom, "dd MMM yyyy")} – ${format(rangeTo, "dd MMM yyyy")}`;
  })();

  const isReady = !!(branchId && subjectId);
  const { data: report, isLoading } = useGetAttendanceReport(
    queryParams as any,
    { query: { enabled: isReady } }
  );

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Print Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a date mode, select branch & subject — then print.
        </p>
      </div>

      {/* Date Mode Tabs */}
      <div className="flex gap-2">
        {(["single","month","range"] as DateMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {m === "single" ? "📅 Single Day" : m === "month" ? "📆 Month" : "🗓️ Date Range"}
          </button>
        ))}
      </div>

      {/* Controls Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Report Parameters
          </CardTitle>
          <CardDescription className="text-xs">Fill required fields to generate report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Branch */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Branch *</Label>
              <Select value={branchId} onValueChange={v => { setBranchId(v); setSubjectId(""); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!branchId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker — changes by mode */}
            {mode === "single" && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 text-sm justify-start font-normal">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {format(singleDate, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={singleDate} onSelect={d => d && setSingleDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {mode === "month" && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Month *</Label>
                <div className="flex gap-2">
                  <Select
                    value={monthDate.getMonth().toString()}
                    onValueChange={v => setMonthDate(new Date(monthDate.getFullYear(), parseInt(v), 1))}
                  >
                    <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    value={monthDate.getFullYear().toString()}
                    onValueChange={v => setMonthDate(new Date(parseInt(v), monthDate.getMonth(), 1))}
                  >
                    <SelectTrigger className="h-9 text-sm w-[90px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2023,2024,2025,2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {mode === "range" && (
              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-medium">Date Range *</Label>
                <div className="flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 text-sm justify-start font-normal flex-1">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        From: {format(rangeFrom, "dd MMM yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={rangeFrom} onSelect={d => d && setRangeFrom(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground text-sm">→</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 text-sm justify-start font-normal flex-1">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        To: {format(rangeTo, "dd MMM yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={rangeTo} onSelect={d => d && setRangeTo(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Faculty Name */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">
                Faculty Name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                className="h-9 text-sm"
                value={facultyName}
                onChange={e => setFacultyName(e.target.value)}
                placeholder="Prof. Jane Doe"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isReady && isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">
          Loading attendance records…
        </div>
      )}

      {/* Empty */}
      {isReady && !isLoading && report && report.records.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-muted/20">
          No attendance records found for this selection.
        </div>
      )}

      {/* Report Preview */}
      {isReady && report && report.records.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{report.branchName}</Badge>
              <Badge variant="outline">{report.subjectName}</Badge>
              <span className="text-xs text-muted-foreground">{dateLabel}</span>
            </div>
            <Button size="sm" onClick={() => openPrintWindow(report, dateLabel, facultyName)}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Report
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 divide-x border rounded-lg overflow-hidden bg-card">
            {[
              { label: "Total Students", value: report.totalStudents, icon: Users, color: "" },
              { label: "Present", value: report.totalPresent, icon: CheckCircle2, color: "text-green-600" },
              { label: "Absent", value: report.totalAbsent, icon: XCircle, color: "text-red-600" },
              {
                label: "Attendance %",
                value: `${report.attendancePercentage.toFixed(1)}%`,
                icon: FileText,
                color: report.attendancePercentage >= 75 ? "text-green-600" : "text-red-600",
              },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-muted/40 border-b flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report Preview</span>
              <span className="text-xs text-muted-foreground">{report.records.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left w-12">#</th>
                    <th className="px-4 py-2 text-left">USN / ID</th>
                    <th className="px-4 py-2 text-left">Student Name</th>
                    {mode !== "single" && <th className="px-4 py-2 text-left">Date</th>}
                    <th className="px-4 py-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((r, i) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-mono text-sm font-semibold">{r.studentCode}</td>
                      <td className="px-4 py-2">{r.studentName}</td>
                      {mode !== "single" && (
                        <td className="px-4 py-2 text-xs text-muted-foreground">{r.date}</td>
                      )}
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          r.status === "present"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        }`}>
                          {r.status === "present" ? "Present" : "Absent"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-right">
            Click "Print Report" to open a print-ready page in a new tab.
          </p>
        </div>
      )}
    </div>
  );
}
