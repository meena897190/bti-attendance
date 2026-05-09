import { useState, useRef } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function ReportPage() {
  const [branchId, setBranchId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [facultyName, setFacultyName] = useState<string>("");

  const { data: branches } = useListBranches();
  const subjectsQuery = branchId ? { branchId: parseInt(branchId, 10) } : {};
  const { data: subjects } = useListSubjects(subjectsQuery, { query: { enabled: !!branchId } });

  const reportParams = {
    branchId: parseInt(branchId, 10),
    subjectId: parseInt(subjectId, 10),
    date: date ? format(date, 'yyyy-MM-dd') : undefined,
    facultyName: facultyName || undefined
  };

  const isReady = !!(branchId && subjectId && date);
  const { data: report, isLoading } = useGetAttendanceReport(reportParams as any, { query: { enabled: isReady } });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Print Report</h1>
        <p className="text-muted-foreground">Generate printable attendance reports.</p>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>Select filters to generate the report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={(val) => { setBranchId(val); setSubjectId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!branchId}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Faculty Name (Optional)</Label>
              <Input value={facultyName} onChange={(e) => setFacultyName(e.target.value)} placeholder="Prof. Jane Doe" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isReady && (
        <div className="flex justify-end no-print">
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
        </div>
      )}

      {/* Printable Area */}
      {isReady && report && (
        <div className="print-only border p-8 bg-white text-black min-h-[800px] shadow-sm rounded-md max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-6 mb-6">
            <div className="flex items-center gap-4">
              <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-20 w-20 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-black uppercase tracking-wide">{report.collegeName}</h1>
                <p className="text-sm font-medium text-gray-700">Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
                <h2 className="text-lg font-semibold text-gray-800 mt-2">Attendance Report</h2>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm border p-4 bg-gray-50 rounded">
            <div><span className="font-semibold text-gray-600">Branch:</span> <span className="text-black font-medium">{report.branchName}</span></div>
            <div><span className="font-semibold text-gray-600">Date:</span> <span className="text-black font-medium">{report.date}</span></div>
            <div><span className="font-semibold text-gray-600">Subject:</span> <span className="text-black font-medium">{report.subjectName} ({report.subjectCode})</span></div>
            <div><span className="font-semibold text-gray-600">Faculty:</span> <span className="text-black font-medium">{report.facultyName || "-"}</span></div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-8 mb-6 text-sm border-b pb-4">
            <div className="flex flex-col"><span className="text-gray-500">Total Students</span><span className="font-bold text-lg">{report.totalStudents}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Present</span><span className="font-bold text-lg text-green-700">{report.totalPresent}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Absent</span><span className="font-bold text-lg text-red-700">{report.totalAbsent}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Percentage</span><span className="font-bold text-lg">{report.attendancePercentage.toFixed(1)}%</span></div>
          </div>

          {/* Table */}
          <table className="w-full text-sm text-left border-collapse border">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="border p-2 font-semibold">S.No</th>
                <th className="border p-2 font-semibold">USN / ID</th>
                <th className="border p-2 font-semibold">Student Name</th>
                <th className="border p-2 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.records.map((record, idx) => (
                <tr key={record.id} className="border-b">
                  <td className="border p-2">{idx + 1}</td>
                  <td className="border p-2 font-medium">{record.studentCode}</td>
                  <td className="border p-2">{record.studentName}</td>
                  <td className={`border p-2 text-center font-bold ${record.status === 'present' ? 'text-green-700' : 'text-red-700'}`}>
                    {record.status === 'present' ? 'P' : 'A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="flex justify-between mt-24 pt-4 px-8 text-sm font-semibold">
            <div className="text-center border-t border-black w-48 pt-2">Faculty Signature</div>
            <div className="text-center border-t border-black w-48 pt-2">HOD Signature</div>
          </div>
        </div>
      )}
    </div>
  );
}
