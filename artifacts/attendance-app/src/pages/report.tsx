import { useState } from "react";
import { format } from "date-fns";
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

/**
 * Opens a fresh browser window with the report HTML and auto-prints it.
 * This bypasses all iframe / CSS-class issues that cause white-screen on print.
 */
function openPrintWindow(report: AttendanceReport, date: Date, facultyName: string) {
  const logoUrl = `${window.location.origin}/bti-logo.jpeg`;
  const rows = report.records
    .map(
      (r, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
        <td style="border:1px solid #d1d5db;padding:6px 10px;color:#6b7280">${i + 1}</td>
        <td style="border:1px solid #d1d5db;padding:6px 10px;font-family:monospace;font-weight:600">${r.studentCode ?? ""}</td>
        <td style="border:1px solid #d1d5db;padding:6px 10px">${r.studentName ?? ""}</td>
        <td style="border:1px solid #d1d5db;padding:6px 10px;text-align:center;font-weight:700;color:${r.status === "present" ? "#15803d" : "#b91c1c"}">${r.status === "present" ? "P" : "A"}</td>
      </tr>`
    )
    .join("");

  const pct = report.attendancePercentage.toFixed(1);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Attendance Report – ${report.branchName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1f2937; padding-bottom: 16px; margin-bottom: 16px; }
    .header img { height: 72px; object-fit: contain; }
    .header h1 { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .header p { font-size: 11px; color: #4b5563; margin-top: 2px; }
    .header h2 { font-size: 14px; font-weight: 600; margin-top: 8px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
    .meta .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
    .meta .val { font-weight: 600; margin-top: 2px; }
    .stats { display: flex; gap: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
    .stats .item { text-align: center; }
    .stats .num { font-size: 22px; font-weight: 700; }
    .stats .lbl { font-size: 10px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f3f4f6; }
    th { border: 1px solid #d1d5db; padding: 7px 10px; text-align: left; font-weight: 700; color: #374151; }
    .sigs { display: flex; justify-content: space-between; margin-top: 64px; padding: 0 16px; }
    .sig { text-align: center; border-top: 1px solid #1f2937; width: 180px; padding-top: 6px; font-size: 12px; font-weight: 600; color: #374151; }
    .footer { font-size: 10px; color: #9ca3af; text-align: right; margin-top: 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body onload="window.print();">
  <div class="header">
    <img src="${logoUrl}" alt="BTI Logo" />
    <div>
      <h1>${report.collegeName}</h1>
      <p>Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
      <h2>Attendance Report</h2>
    </div>
  </div>

  <div class="meta">
    <div><div class="label">Branch</div><div class="val">${report.branchName}</div></div>
    <div><div class="label">Date</div><div class="val">${format(date, "dd MMMM yyyy")}</div></div>
    <div><div class="label">Subject</div><div class="val">${report.subjectName} (${report.subjectCode})</div></div>
    <div><div class="label">Faculty</div><div class="val">${facultyName || "—"}</div></div>
  </div>

  <div class="stats">
    <div class="item"><div class="num">${report.totalStudents}</div><div class="lbl">Total Students</div></div>
    <div class="item"><div class="num" style="color:#15803d">${report.totalPresent}</div><div class="lbl">Present</div></div>
    <div class="item"><div class="num" style="color:#b91c1c">${report.totalAbsent}</div><div class="lbl">Absent</div></div>
    <div class="item"><div class="num" style="color:${report.attendancePercentage >= 75 ? "#15803d" : "#b91c1c"}">${pct}%</div><div class="lbl">Attendance</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>S.No</th><th>USN / ID</th><th>Student Name</th><th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Total: ${report.records.length} records</div>

  <div class="sigs">
    <div class="sig">Faculty Signature</div>
    <div class="sig">HOD Signature</div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) {
    alert("Please allow pop-ups for this site to enable printing.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export default function ReportPage() {
  const [branchId, setBranchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [facultyName, setFacultyName] = useState("");

  const { data: branches } = useListBranches();
  const { data: subjects } = useListSubjects(
    { branchId: parseInt(branchId, 10) },
    { query: { enabled: !!branchId } }
  );

  const isReady = !!(branchId && subjectId);
  const { data: report, isLoading } = useGetAttendanceReport(
    {
      branchId: parseInt(branchId, 10),
      subjectId: parseInt(subjectId, 10),
      date: format(date, "yyyy-MM-dd"),
      facultyName: facultyName || undefined,
    } as any,
    { query: { enabled: isReady } }
  );

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Print Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select branch, subject and date — the report preview appears below. Click Print to open a printable page.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Report Parameters
          </CardTitle>
          <CardDescription className="text-xs">All fields except Faculty Name are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Branch *</Label>
              <Select value={branchId} onValueChange={v => { setBranchId(v); setSubjectId(""); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!branchId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm justify-start font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {format(date, "dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

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

      {/* Report preview */}
      {isReady && report && report.records.length > 0 && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{report.branchName}</Badge>
              <Badge variant="outline">{report.subjectName}</Badge>
              <span className="text-xs text-muted-foreground">{format(date, "dd MMMM yyyy")}</span>
            </div>
            <Button size="sm" onClick={() => openPrintWindow(report, date, facultyName)}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Report
            </Button>
          </div>

          {/* Stats row */}
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

          {/* Preview table */}
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
                    <th className="px-4 py-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((r, i) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-mono text-sm font-semibold">{r.studentCode}</td>
                      <td className="px-4 py-2">{r.studentName}</td>
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
