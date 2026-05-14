import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import {
  useListBranches,
  useListSubjects,
  useGetAttendanceReport
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Printer, FileText, Calendar, BarChart3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

type ReportMode = "single" | "range" | "monthly";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

export default function ReportPage() {
  const [mode, setMode] = useState<ReportMode>("single");
  const [branchId, setBranchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [facultyName, setFacultyName] = useState("");

  // Single day
  const [singleDate, setSingleDate] = useState<Date>(new Date());

  // Date range
  const [fromDate, setFromDate] = useState<Date>(new Date(new Date().setDate(1)));
  const [toDate, setToDate] = useState<Date>(new Date());

  // Monthly
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
  const [year, setYear] = useState(currentYear);

  const { data: branches } = useListBranches();
  const { data: subjects } = useListSubjects(
    { branchId: parseInt(branchId, 10) },
    { query: { enabled: !!branchId } }
  );

  const reportParams = useMemo(() => {
    if (!branchId || !subjectId) return null;
    const base = {
      branchId: parseInt(branchId, 10),
      subjectId: parseInt(subjectId, 10),
      facultyName: facultyName || undefined,
    };
    if (mode === "single") {
      return { ...base, date: format(singleDate, "yyyy-MM-dd") };
    }
    if (mode === "range") {
      return { ...base, startDate: format(fromDate, "yyyy-MM-dd"), endDate: format(toDate, "yyyy-MM-dd") };
    }
    // monthly
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    return { ...base, startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
  }, [mode, branchId, subjectId, facultyName, singleDate, fromDate, toDate, month, year]);

  const isReady = !!reportParams;
  const { data: report, isLoading } = useGetAttendanceReport(
    reportParams as any,
    { query: { enabled: isReady } }
  );

  // For monthly/range: group by student and pivot by date
  const rangeData = useMemo(() => {
    if (!report || mode === "single") return null;
    const studentMap = new Map<string, { name: string; code: string; id: number; dates: Map<string, string> }>();
    const dateSet = new Set<string>();

    for (const rec of report.records) {
      dateSet.add(rec.date);
      const key = String(rec.studentId);
      if (!studentMap.has(key)) {
        studentMap.set(key, { name: rec.studentName, code: rec.studentCode, id: rec.studentId, dates: new Map() });
      }
      studentMap.get(key)!.dates.set(rec.date, rec.status);
    }

    const dates = [...dateSet].sort();
    const students = [...studentMap.values()].sort((a, b) => a.code.localeCompare(b.code));
    return { dates, students };
  }, [report, mode]);

  // Summary stats for range/monthly
  const rangeSummary = useMemo(() => {
    if (!report || mode === "single") return null;
    const byStudent = new Map<number, { name: string; code: string; present: number; total: number }>();
    for (const rec of report.records) {
      if (!byStudent.has(rec.studentId)) {
        byStudent.set(rec.studentId, { name: rec.studentName, code: rec.studentCode, present: 0, total: 0 });
      }
      const s = byStudent.get(rec.studentId)!;
      s.total++;
      if (rec.status === "present") s.present++;
    }
    return [...byStudent.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [report, mode]);

  const reportTitle = mode === "single"
    ? `Attendance Report — ${format(singleDate, "dd MMM yyyy")}`
    : mode === "monthly"
      ? `Monthly Report — ${MONTHS[month]} ${year}`
      : `Attendance Report — ${format(fromDate, "dd MMM")} to ${format(toDate, "dd MMM yyyy")}`;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="no-print">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate single-day, date-range, or monthly attendance reports.</p>
      </div>

      {/* Controls */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Report Parameters</CardTitle>
          <CardDescription className="text-xs">Select branch, subject, date range and faculty to generate a report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode tabs */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Report Type</Label>
            <Tabs value={mode} onValueChange={v => setMode(v as ReportMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="single" className="text-xs gap-1.5 px-3 h-7">
                  <CalendarIcon className="h-3 w-3" /> Single Day
                </TabsTrigger>
                <TabsTrigger value="range" className="text-xs gap-1.5 px-3 h-7">
                  <Calendar className="h-3 w-3" /> Date Range
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs gap-1.5 px-3 h-7">
                  <BarChart3 className="h-3 w-3" /> Monthly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Branch + Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Branch *</Label>
              <Select value={branchId} onValueChange={v => { setBranchId(v); setSubjectId(""); }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!branchId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>{subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Date pickers — vary by mode */}
          {mode === "single" && (
            <div className="grid gap-1.5 max-w-xs">
              <Label className="text-xs">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 text-sm justify-start font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {format(singleDate, "dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={singleDate} onSelect={d => d && setSingleDate(d)} initialFocus /></PopoverContent>
              </Popover>
            </div>
          )}

          {mode === "range" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">From Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 text-sm justify-start font-normal">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />{format(fromDate, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={fromDate} onSelect={d => d && setFromDate(d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">To Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 text-sm justify-start font-normal">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />{format(toDate, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={toDate} onSelect={d => d && setToDate(d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {mode === "monthly" && (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div className="grid gap-1.5">
                <Label className="text-xs">Month *</Label>
                <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Year *</Label>
                <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Faculty name */}
          <div className="grid gap-1.5 max-w-xs">
            <Label className="text-xs">Faculty Name <span className="text-muted-foreground">(optional)</span></Label>
            <Input className="h-8 text-sm" value={facultyName} onChange={e => setFacultyName(e.target.value)} placeholder="Prof. Jane Doe" />
          </div>
        </CardContent>
      </Card>

      {/* Generate/Print button */}
      {isReady && (
        <div className="no-print flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading report…" : report
              ? `${report.totalStudents} students · ${report.records.length} record${report.records.length !== 1 ? "s" : ""}`
              : "No records found for this selection."}
          </div>
          {report && (
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Report
            </Button>
          )}
        </div>
      )}

      {/* ── PRINT AREA ──────────────────────────────────────────────── */}
      {isReady && report && (
        <div className="print-area">
          {/* Screen preview card */}
          <div className="no-print border rounded-lg bg-card overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/40 flex items-center justify-between">
              <p className="text-sm font-medium">{reportTitle}</p>
              <div className="flex gap-2">
                <Badge variant="secondary">{report.branchName}</Badge>
                <Badge variant="outline">{report.subjectName}</Badge>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 divide-x text-center py-3 border-b">
              {[
                { label: "Total Students", value: report.totalStudents, color: "" },
                { label: "Present", value: report.totalPresent, color: "text-green-600" },
                { label: "Absent", value: report.totalAbsent, color: "text-red-600" },
                { label: "Attendance %", value: `${report.attendancePercentage.toFixed(1)}%`, color: report.attendancePercentage >= 75 ? "text-green-600" : "text-red-600" },
              ].map(s => (
                <div key={s.label} className="px-3 py-1">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Table preview */}
            <div className="overflow-x-auto">
              {mode === "single" ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left w-10">#</th>
                    <th className="px-4 py-2 text-left">USN</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-center w-24">Status</th>
                  </tr></thead>
                  <tbody>
                    {report.records.map((r, i) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-4 py-2 font-mono text-sm">{r.studentCode}</td>
                        <td className="px-4 py-2">{r.studentName}</td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant={r.status === "present" ? "default" : "destructive"} className="text-xs px-2">
                            {r.status === "present" ? "Present" : "Absent"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left w-10">#</th>
                    <th className="px-4 py-2 text-left">USN</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-center">Present</th>
                    <th className="px-4 py-2 text-center">Absent</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">%</th>
                  </tr></thead>
                  <tbody>
                    {rangeSummary?.map((s, i) => {
                      const pct = s.total > 0 ? ((s.present / s.total) * 100) : 0;
                      return (
                        <tr key={s.code} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-4 py-2 font-mono text-sm">{s.code}</td>
                          <td className="px-4 py-2">{s.name}</td>
                          <td className="px-4 py-2 text-center text-green-600 font-semibold">{s.present}</td>
                          <td className="px-4 py-2 text-center text-red-600 font-semibold">{s.total - s.present}</td>
                          <td className="px-4 py-2 text-center">{s.total}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={pct >= 75 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                              {pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── PRINT-ONLY VERSION ─────────────────── */}
          <div className="print-only">
            {/* Letterhead */}
            <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-4">
              <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-20 object-contain" />
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wide">{report.collegeName}</h1>
                <p className="text-xs text-gray-600">Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
                <p className="text-base font-semibold mt-1">Attendance Report</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm bg-gray-50 border p-3 rounded">
              <div><span className="font-semibold">Branch:</span> {report.branchName}</div>
              <div><span className="font-semibold">Subject:</span> {report.subjectName} ({report.subjectCode})</div>
              <div><span className="font-semibold">Period:</span> {
                mode === "single" ? format(singleDate, "dd MMMM yyyy")
                : mode === "monthly" ? `${MONTHS[month]} ${year}`
                : `${format(fromDate, "dd MMM yyyy")} to ${format(toDate, "dd MMM yyyy")}`
              }</div>
              <div><span className="font-semibold">Faculty:</span> {facultyName || "—"}</div>
            </div>

            {/* Summary */}
            <div className="flex gap-6 mb-4 text-sm border-b pb-3">
              <div><span className="text-gray-500">Total Students</span><div className="font-bold text-lg">{report.totalStudents}</div></div>
              <div><span className="text-gray-500">Present</span><div className="font-bold text-lg text-green-700">{report.totalPresent}</div></div>
              <div><span className="text-gray-500">Absent</span><div className="font-bold text-lg text-red-700">{report.totalAbsent}</div></div>
              <div><span className="text-gray-500">Attendance %</span><div className="font-bold text-lg">{report.attendancePercentage.toFixed(1)}%</div></div>
            </div>

            {/* Data table */}
            {mode === "single" ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <th className="border border-gray-300 px-2 py-1 text-left">S.No</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">USN / ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Student Name</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((r, i) => (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td className="border border-gray-200 px-2 py-1">{i + 1}</td>
                      <td className="border border-gray-200 px-2 py-1 font-mono">{r.studentCode}</td>
                      <td className="border border-gray-200 px-2 py-1">{r.studentName}</td>
                      <td className={`border border-gray-200 px-2 py-1 text-center font-bold ${r.status === "present" ? "text-green-700" : "text-red-700"}`}>
                        {r.status === "present" ? "P" : "A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <th className="border border-gray-300 px-2 py-1 text-left">#</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">USN / ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Student Name</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Days Present</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Days Absent</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Total Days</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {rangeSummary?.map((s, i) => {
                    const pct = s.total > 0 ? ((s.present / s.total) * 100) : 0;
                    return (
                      <tr key={s.code} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td className="border border-gray-200 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-200 px-2 py-1 font-mono">{s.code}</td>
                        <td className="border border-gray-200 px-2 py-1">{s.name}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center text-green-700 font-semibold">{s.present}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center text-red-700 font-semibold">{s.total - s.present}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center">{s.total}</td>
                        <td className={`border border-gray-200 px-2 py-1 text-center font-bold ${pct >= 75 ? "text-green-700" : "text-red-700"}`}>
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Signatures */}
            <div className="flex justify-between mt-16 text-sm font-semibold">
              <div className="text-center border-t border-black w-48 pt-2">Faculty Signature</div>
              <div className="text-center border-t border-black w-48 pt-2">HOD Signature</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
