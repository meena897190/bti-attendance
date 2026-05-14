import { useState } from "react";
import {
  useListStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useListBranches,
  usePromoteStudents,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Pencil, Trash2, Plus, Search, Users, Building2,
  Printer, X, Filter, GraduationCap, ChevronUp,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { binarySearchByStudentId, binarySearchByName } from "@/lib/binary-search";

type StudentFormData = {
  studentId: string; name: string; branchId: string;
  year: string; section: string; phone: string; email: string;
};
const emptyForm: StudentFormData = { studentId: "", name: "", branchId: "", year: "", section: "", phone: "", email: "" };

function StudentForm({ formData, setFormData, branches }: {
  formData: StudentFormData;
  setFormData: (fn: (prev: StudentFormData) => StudentFormData) => void;
  branches: { id: number; name: string }[] | undefined;
}) {
  return (
    <div className="grid gap-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">USN / ID *</Label>
          <Input value={formData.studentId} onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))} placeholder="1BT20CS001" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Full Name *</Label>
          <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Branch *</Label>
        <Select value={formData.branchId} onValueChange={val => setFormData(p => ({ ...p, branchId: val }))}>
          <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
          <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Year *</Label>
          <Select value={formData.year} onValueChange={val => setFormData(p => ({ ...p, year: val }))}>
            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Section *</Label>
          <Input value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))} placeholder="A" maxLength={2} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Phone</Label>
          <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="student@example.com" />
        </div>
      </div>
    </div>
  );
}

function BranchStudentTable({ branchId, branchName, searchQuery, filterYear, filterSection, highlightIds, onEdit, onDelete }: {
  branchId: number; branchName: string; searchQuery: string;
  filterYear: string; filterSection: string; highlightIds: Set<number>;
  onEdit: (s: any) => void; onDelete: (id: number, name: string) => void;
}) {
  const params = {
    branchId,
    ...(filterYear !== "all" && { year: parseInt(filterYear, 10) }),
    ...(filterSection !== "all" && { section: filterSection }),
    ...(searchQuery && { search: searchQuery }),
  };
  const { data: students, isLoading } = useListStudents(params, { query: { queryKey: getListStudentsQueryKey(params) } });

  if (isLoading) return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
    </div>
  );
  if (!students || students.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
      <Users className="h-8 w-8 opacity-20" />
      <p className="text-sm">No students match the current filters.</p>
    </div>
  );

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10 text-center text-xs text-muted-foreground">#</TableHead>
            <TableHead className="text-xs text-muted-foreground">USN / ID</TableHead>
            <TableHead className="text-xs text-muted-foreground">Name</TableHead>
            <TableHead className="text-xs text-muted-foreground">Year</TableHead>
            <TableHead className="text-xs text-muted-foreground">Section</TableHead>
            <TableHead className="text-xs text-muted-foreground">Contact</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s, idx) => {
            const hl = highlightIds.has(s.id);
            return (
              <TableRow key={s.id} className={hl ? "bg-amber-50 dark:bg-amber-950/30 ring-1 ring-inset ring-amber-400" : undefined}>
                <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-mono text-sm font-semibold">{s.studentId}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs px-1.5">Yr {s.year}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs px-1.5">§{s.section}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                  {s.email && <div className="truncate">{s.email}</div>}
                  {s.phone && <div>{s.phone}</div>}
                  {!s.email && !s.phone && <span className="opacity-30">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently delete <strong>{s.name}</strong> ({s.studentId}) and all their attendance records. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => onDelete(s.id, s.name)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="px-4 py-2 bg-muted/20 border-t text-xs text-muted-foreground">
        {students.length} student{students.length !== 1 ? "s" : ""} in {branchName}
      </div>
    </div>
  );
}

/* ─── Print helper: opens a new window with self-contained HTML ─── */
function openStudentPrintWindow(
  students: any[],
  branchName: string,
  branchCode: string,
  filterYear: string,
  filterSection: string
) {
  const rows = students
    .map(
      (s, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
        <td style="border:1px solid #d1d5db;padding:5px 8px;text-align:center;color:#6b7280">${i + 1}</td>
        <td style="border:1px solid #d1d5db;padding:5px 8px;font-family:monospace;font-weight:600">${s.studentId}</td>
        <td style="border:1px solid #d1d5db;padding:5px 8px">${s.name}</td>
        <td style="border:1px solid #d1d5db;padding:5px 8px;text-align:center">${s.year}</td>
        <td style="border:1px solid #d1d5db;padding:5px 8px;text-align:center">${s.section}</td>
        <td style="border:1px solid #d1d5db;padding:5px 8px">${s.phone ?? "—"}</td>
        <td style="border:1px solid #d1d5db;padding:5px 8px">${s.email ?? "—"}</td>
      </tr>`
    )
    .join("");

  const logoUrl = `${window.location.origin}/bti-logo.jpeg`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const filters = [filterYear !== "all" ? `Year ${filterYear}` : "", filterSection !== "all" ? `Section ${filterSection}` : ""].filter(Boolean).join(" · ");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student List – ${branchName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 28px; }
    .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1f2937; padding-bottom: 12px; margin-bottom: 10px; }
    .header img { height: 60px; object-fit: contain; }
    .header h1 { font-size: 16px; font-weight: 700; text-transform: uppercase; }
    .header p { font-size: 10px; color: #4b5563; margin-top: 2px; }
    .subtitle { font-size: 13px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 4px; }
    .meta { font-size: 10px; color: #6b7280; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #f3f4f6; }
    th { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-weight: 700; }
    .footer { display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; margin-top: 6px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body onload="window.print();">
  <div class="header">
    <img src="${logoUrl}" alt="BTI Logo" />
    <div>
      <h1>Bangalore Technological Institute</h1>
      <p>Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
    </div>
  </div>
  <div class="subtitle">Student List — ${branchName} (${branchCode})</div>
  <div class="meta">Printed on ${dateStr}${filters ? " · " + filters : ""}</div>
  <table>
    <thead>
      <tr>
        <th style="width:32px">#</th><th>USN / ID</th><th>Student Name</th>
        <th style="width:40px;text-align:center">Yr</th><th style="width:40px;text-align:center">Sec</th>
        <th>Phone</th><th>Email</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Total: ${students.length} students</span>
    <span>BTI Smart Attendance System</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Please allow pop-ups for this site to enable printing."); return; }
  win.document.write(html);
  win.document.close();
}

/* ─── Promote Dialog ─── */
function PromoteDialog({ branches, onDone }: {
  branches: { id: number; name: string; code: string }[] | undefined;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "branch">("branch");
  const [branchId, setBranchId] = useState("");
  const promote = usePromoteStudents();

  const handlePromote = () => {
    const payload = scope === "branch" && branchId ? { branchId: parseInt(branchId, 10) } : {};
    promote.mutate(
      { data: payload },
      {
        onSuccess: (result) => {
          const where = result.branchName ? `in ${result.branchName}` : "across all branches";
          toast.success(
            `Promoted ${result.promoted} student${result.promoted !== 1 ? "s" : ""} ${where}.` +
            (result.graduatingCount > 0
              ? ` ${result.graduatingCount} Year 4 student${result.graduatingCount !== 1 ? "s" : ""} are now graduating.`
              : "")
          );
          setOpen(false);
          onDone();
        },
        onError: () => toast.error("Promotion failed. Please try again."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GraduationCap className="h-4 w-4 mr-1.5" /> Promote Students
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChevronUp className="h-5 w-5 text-primary" /> Promote Students
          </DialogTitle>
          <DialogDescription>
            Move students up one academic year (1→2, 2→3, 3→4). Year 4 students remain and are counted as graduating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">Scope</Label>
            <Select value={scope} onValueChange={(v: "all" | "branch") => setScope(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="branch">One branch only</SelectItem>
                <SelectItem value="all">All branches</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "branch" && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">What this does:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Year 1 students → Year 2</li>
              <li>Year 2 students → Year 3</li>
              <li>Year 3 students → Year 4</li>
              <li>Year 4 students — counted as graduating (not deleted)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handlePromote}
            disabled={promote.isPending || (scope === "branch" && !branchId)}
          >
            {promote.isPending ? "Promoting…" : "Confirm Promotion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main page ─── */
export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [filterYear, setFilterYear] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [binarySearchType, setBinarySearchType] = useState<"id" | "name">("id");
  const [highlightIds, setHighlightIds] = useState<Set<number>>(new Set());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>(emptyForm);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [activeBranchId, setActiveBranchId] = useState<string>("");

  const { data: branches, isLoading: branchesLoading } = useListBranches();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const { data: allStudents } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });

  const activeBranch = branches?.find(b => b.id.toString() === activeBranchId) ?? branches?.[0];

  // Data for printing (all students in active branch with current filters)
  const printParams = activeBranch ? {
    branchId: activeBranch.id,
    ...(filterYear !== "all" && { year: parseInt(filterYear, 10) }),
    ...(filterSection !== "all" && { section: filterSection }),
  } : undefined;
  const { data: printStudents } = useListStudents(printParams ?? {}, {
    query: { enabled: !!activeBranch, queryKey: getListStudentsQueryKey(printParams ?? {}) }
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({}) });
    branches?.forEach(b =>
      queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({ branchId: b.id }) })
    );
  };

  const handleCreate = () => {
    if (!formData.studentId || !formData.name || !formData.branchId || !formData.year || !formData.section) {
      toast.error("Please fill all required fields"); return;
    }
    createStudent.mutate(
      { data: { studentId: formData.studentId, name: formData.name, branchId: parseInt(formData.branchId, 10), year: parseInt(formData.year, 10), section: formData.section, phone: formData.phone || undefined, email: formData.email || undefined } },
      { onSuccess: () => { invalidateAll(); toast.success("Student added"); setIsAddOpen(false); setFormData(emptyForm); }, onError: () => toast.error("Failed to add student") }
    );
  };

  const handleUpdate = () => {
    if (!editingStudent) return;
    updateStudent.mutate(
      { id: editingStudent.id, data: { studentId: formData.studentId, name: formData.name, branchId: parseInt(formData.branchId, 10), year: parseInt(formData.year, 10), section: formData.section, phone: formData.phone || undefined, email: formData.email || undefined } },
      { onSuccess: () => { invalidateAll(); toast.success("Student updated"); setEditingStudent(null); }, onError: () => toast.error("Failed to update") }
    );
  };

  const handleDelete = (id: number, name: string) => {
    deleteStudent.mutate({ id }, {
      onSuccess: () => { invalidateAll(); toast.success(`${name} deleted`); },
      onError: () => toast.error("Failed to delete"),
    });
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({ studentId: student.studentId, name: student.name, branchId: student.branchId.toString(), year: student.year.toString(), section: student.section, phone: student.phone ?? "", email: student.email ?? "" });
  };

  const handleBinarySearch = () => {
    if (!searchQuery.trim()) { toast.error("Enter a search term first"); return; }
    if (!allStudents?.length) { toast.error("Student data not loaded yet"); return; }

    const results = binarySearchType === "id"
      ? binarySearchByStudentId(allStudents, searchQuery)
      : binarySearchByName(allStudents, searchQuery);

    if (!results.length) {
      toast.error(`No student found matching "${searchQuery}"`);
      setHighlightIds(new Set());
      return;
    }
    setHighlightIds(new Set(results.map(r => r.id)));
    toast.success(results.length === 1
      ? `Found: ${results[0].name} (${results[0].studentId})`
      : `Found ${results.length} matches for "${searchQuery}"`);
  };

  const hasFilters = filterYear !== "all" || filterSection !== "all" || searchQuery || highlightIds.size > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage students by branch. Use binary search for fast lookup.</p>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          <PromoteDialog branches={branches as any} onDone={invalidateAll} />
          <Button
            variant="outline" size="sm"
            onClick={() => {
              if (!activeBranch || !printStudents) return;
              openStudentPrintWindow(printStudents, activeBranch.name, activeBranch.code ?? "", filterYear, filterSection);
            }}
            disabled={!activeBranch}
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print List
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Fill in the student's details below. Required fields are marked *</DialogDescription>
              </DialogHeader>
              <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={createStudent.isPending}>
                  {createStudent.isPending ? "Saving…" : "Add Student"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter panel */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-3 space-y-3">
          {/* Binary search row */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Search className="h-3 w-3" /> Quick Find — Binary Search
            </p>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder={binarySearchType === "id" ? "Type USN prefix, e.g. 1BT20CS…" : "Type name prefix, e.g. Rah…"}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setHighlightIds(new Set()); }}
                onKeyDown={e => e.key === "Enter" && handleBinarySearch()}
                className="flex-1 min-w-[200px] h-9 text-sm"
              />
              <Select value={binarySearchType} onValueChange={(v: "id" | "name") => { setBinarySearchType(v); setHighlightIds(new Set()); }}>
                <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">By USN/ID</SelectItem>
                  <SelectItem value="name">By Name</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-9" onClick={handleBinarySearch}>
                <Search className="h-3.5 w-3.5 mr-1.5" /> Search
              </Button>
              {highlightIds.size > 0 && (
                <Button size="sm" variant="ghost" className="h-9 text-muted-foreground text-xs" onClick={() => setHighlightIds(new Set())}>
                  <X className="h-3.5 w-3.5 mr-1" /> Clear ({highlightIds.size})
                </Button>
              )}
            </div>
            {highlightIds.size > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                ✓ {highlightIds.size} match{highlightIds.size !== 1 ? "es" : ""} highlighted in yellow below
              </p>
            )}
          </div>

          <div className="border-t" />

          {/* Table filter row */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Filter Table
            </p>
            <div className="flex gap-2 flex-wrap items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Year</p>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Section</p>
                <Select value={filterSection} onValueChange={setFilterSection}>
                  <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {["A","B","C","D"].map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => { setFilterYear("all"); setFilterSection("all"); setSearchQuery(""); setHighlightIds(new Set()); }}>
                  <X className="h-3 w-3 mr-1" /> Reset all
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch Tabs */}
      {branchesLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !branches || branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Building2 className="h-10 w-10 opacity-20" />
          <p className="text-sm">No branches yet. Add a branch first.</p>
        </div>
      ) : (
        <Tabs defaultValue={branches[0]?.id.toString()} onValueChange={setActiveBranchId} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg w-full justify-start mb-2">
            {branches.map(b => (
              <TabsTrigger key={b.id} value={b.id.toString()} className="text-xs font-semibold px-3 py-1.5">
                {(b as any).code ?? b.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {branches.map(b => (
            <TabsContent key={b.id} value={b.id.toString()} className="mt-0">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-semibold">{b.name}</h2>
                <Badge variant="outline" className="text-xs px-1.5">{(b as any).code}</Badge>
              </div>
              <BranchStudentTable
                branchId={b.id}
                branchName={b.name}
                searchQuery={searchQuery}
                filterYear={filterYear}
                filterSection={filterSection}
                highlightIds={highlightIds}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={open => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student's details below.</DialogDescription>
          </DialogHeader>
          <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateStudent.isPending}>
              {updateStudent.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
