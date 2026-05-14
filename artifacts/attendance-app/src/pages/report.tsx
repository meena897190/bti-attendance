import { useState } from "react";
import { format } from "date-fns";
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
import { CalendarIcon, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function ReportPage() {
  const [branchId, setBranchId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [facultyName, setFacultyName] = useState<string>("");

  const { data: branches } = useListBranches();
  const { data: subjects } = useListSubjects(
    { branchId: parseInt(branchId, 10) },
    { query: { enabled: !!branchId } }
  );

  const reportParams = {
    branchId: parseInt(branchId, 10),
    subjectId: parseInt(subjectId, 10),
    date: format(date, "yyyy-MM-dd"),
    facultyName: facultyName || undefined,
  };

  const isReady = !!(branchId && subjectId && date);
  const { data: report, isLoading } = useGetAttendanceReport(
    reportParams as any,
    { query: { enabled: isReady } }
  );

  return (
    <div className="space-y-6">

      {/* Page header — hidden when printing */}
      <div className="no-print">
        <h1 className="text-2xl font-bold tracking-tight">Print Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Select a branch, subject and date, then print the attendance report.</p>
      </div>

      {/* Controls card — hidden when printing */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Parameters</CardTitle>
          <CardDescription className="text-xs">Choose filters to generate the attendance report below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label className="text-xs">Branch *</Label>
              <Select value={branchId} onValueChange={v => { setBranchId(v); setSubjectId(""); }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!branchId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 text-sm justify-start font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {format(date, "dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Faculty Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input className="h-8 text-sm" value={facultyName} onChange={e => setFacultyName(e.target.value)} placeholder="Prof. Jane Doe" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print button — hidden when printing */}
      {isReady && report && (
        <div className="no-print flex justify-end">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isReady && isLoading && (
        <div className="no-print text-center py-10 text-muted-foreground text-sm">Loading report…</div>
      )}

      {/* No data state */}
      {isReady && !isLoading && report && report.records.length === 0 && (
        <div className="no-print text-center py-10 text-muted-foreground text-sm">No attendance records found for this selection.</div>
      )}

      {/* ── PRINTABLE REPORT — always visible on screen, printed as-is ── */}
      {isReady && report && report.records.length > 0 && (
        <div className="border rounded-lg p-8 bg-white text-black shadow-sm max-w-4xl mx-auto">

          {/* Letterhead */}
          <div className="flex items-center gap-4 border-b-2 border-gray-800 pb-5 mb-5">
            <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-20 object-contain" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide text-black">{report.collegeName}</h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Affiliated to VTU, Belagavi &nbsp;|&nbsp; Accredited by NAAC &nbsp;|&nbsp; ISO Certified
              </p>
              <p className="text-base font-semibold text-gray-800 mt-2">Attendance Report</p>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm border border-gray-200 bg-gray-50 rounded p-4">
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Branch</span>
              <p className="font-medium text-black mt-0.5">{report.branchName}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Date</span>
              <p className="font-medium text-black mt-0.5">{format(date, "dd MMMM yyyy")}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Subject</span>
              <p className="font-medium text-black mt-0.5">{report.subjectName} <span className="text-gray-500">({report.subjectCode})</span></p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Faculty</span>
              <p className="font-medium text-black mt-0.5">{facultyName || "—"}</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex gap-8 mb-6 border-b border-gray-200 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{report.totalStudents}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{report.totalPresent}</div>
              <div className="text-xs text-gray-500 mt-0.5">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{report.totalAbsent}</div>
              <div className="text-xs text-gray-500 mt-0.5">Absent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${report.attendancePercentage >= 75 ? "text-green-700" : "text-red-700"}`}>
                {report.attendancePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Attendance</div>
            </div>
          </div>

          {/* Attendance table */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">S.No</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">USN / ID</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Student Name</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.records.map((record, idx) => (
                <tr key={record.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td className="border border-gray-200 px-3 py-1.5 text-gray-500">{idx + 1}</td>
                  <td className="border border-gray-200 px-3 py-1.5 font-mono font-medium text-black">{record.studentCode}</td>
                  <td className="border border-gray-200 px-3 py-1.5 text-black">{record.studentName}</td>
                  <td className={`border border-gray-200 px-3 py-1.5 text-center font-bold ${record.status === "present" ? "text-green-700" : "text-red-700"}`}>
                    {record.status === "present" ? "P" : "A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-right mt-2">Total: {report.records.length} records</p>

          {/* Signature lines */}
          <div className="flex justify-between mt-16 px-4">
            <div className="text-center">
              <div className="border-t border-gray-800 w-44 pt-2 text-sm font-semibold text-gray-700">Faculty Signature</div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-800 w-44 pt-2 text-sm font-semibold text-gray-700">HOD Signature</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
