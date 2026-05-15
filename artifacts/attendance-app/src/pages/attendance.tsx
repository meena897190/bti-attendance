import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  useListBranches, 
  useListSubjects,
  useListStudents,
  useCreateAttendance,
  useListAttendance
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  
  // Selection state for taking attendance
  const [branchId, setBranchId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  
  // Attendance state (studentId -> true for present, false for absent)
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});

  const { data: branches } = useListBranches();
  
  const subjectsQuery = branchId ? { branchId: parseInt(branchId, 10) } : {};
  const { data: subjects } = useListSubjects(subjectsQuery, { query: { enabled: !!branchId } });
  
  const studentsQuery = branchId ? { branchId: parseInt(branchId, 10) } : {};
  const { data: students, isLoading: loadingStudents } = useListStudents(studentsQuery, { query: { enabled: !!branchId } });

  const createAttendance = useCreateAttendance();

  // Initialize attendance state when students load
  useEffect(() => {
    if (students && Object.keys(attendanceState).length === 0) {
      const initial: Record<number, boolean> = {};
      students.forEach(s => { initial[s.id] = true; }); // Default present
      setAttendanceState(initial);
    }
  }, [students, attendanceState]);

  const toggleAll = (checked: boolean) => {
    if (!students) return;
    const newState: Record<number, boolean> = {};
    students.forEach(s => { newState[s.id] = checked; });
    setAttendanceState(newState);
  };

  const handleToggleStudent = (studentId: number, checked: boolean) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: checked }));
  };

  const handleSubmit = () => {
    if (!branchId || !subjectId || !date || !students) {
      toast.error("Please select branch, subject and date.");
      return;
    }

    const records = students.map(student => ({
      studentId: student.id,
      subjectId: parseInt(subjectId, 10),
      branchId: parseInt(branchId, 10),
      date: format(date, 'yyyy-MM-dd'),
      status: attendanceState[student.id] ? "present" : "absent"
    }));

    createAttendance.mutate(
      { data: { records } },
      {
        onSuccess: () => {
          toast.success(`Attendance marked successfully for ${records.length} students`);
          // Reset form or stay on page
          setAttendanceState({});
        },
        onError: () => toast.error("Failed to mark attendance")
      }
    );
  };

  const allPresent = students ? students.every(s => attendanceState[s.id]) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Take Attendance</h1>
        <p className="text-muted-foreground">Select branch, subject and date to mark attendance.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={(val) => { setBranchId(val); setSubjectId(""); setAttendanceState({}); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
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
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {branchId && subjectId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Students List</CardTitle>
              <CardDescription>Mark checkboxes for present students.</CardDescription>
            </div>
            <Button onClick={handleSubmit} disabled={createAttendance.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save Attendance
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={allPresent}
                      onCheckedChange={(checked) => toggleAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead>USN/ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingStudents ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : students?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No students found in this branch.
                    </TableCell>
                  </TableRow>
                ) : (
                  students?.map((student) => {
                    const isPresent = attendanceState[student.id] ?? true;
                    return (
                      <TableRow key={student.id} className={!isPresent ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={isPresent}
                            onCheckedChange={(checked) => handleToggleStudent(student.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${isPresent ? 'text-primary' : 'text-destructive'}`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
