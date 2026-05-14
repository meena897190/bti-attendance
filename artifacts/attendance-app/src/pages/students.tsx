import { useState } from "react";
import {
  useListStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useListBranches,
  getListStudentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Users, Building2, Printer, X, Filter } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>USN / ID *</Label>
          <Input value={formData.studentId} onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))} placeholder="1BT20CS001" />
        </div>
        <div className="grid gap-1.5">
          <Label>Full Name *</Label>
          <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Branch *</Label>
        <Select value={formData.branchId} onValueChange={val => setFormData(p => ({ ...p, branchId: val }))}>
          <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
          <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Year *</Label>
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
          <Label>Section *</Label>
          <Input value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))} placeholder="A" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
        </div>
        <div className="grid gap-1.5">
          <Label>Email</Label>
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
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );

  if (!students || students.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
      <Users className="h-8 w-8 opacity-30" />
      <p className="text-sm">No students in {branchName} match the filters.</p>
    </div>
  );

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">USN / ID</TableHead>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Year</TableHead>
            <TableHead className="text-xs">Section</TableHead>
            <TableHead className="text-xs">Contact</TableHead>
            <TableHead className="w-20 text-xs no-print" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, idx) => {
            const highlighted = highlightIds.has(student.id);
            return (
              <TableRow
                key={student.id}
                className={highlighted ? "bg-yellow-50 dark:bg-yellow-950/40 ring-1 ring-yellow-400 ring-inset" : undefined}
              >
                <TableCell className="text-center text-muted-foreground text-xs">{idx + 1}</TableCell>
                <TableCell className="font-mono text-sm font-semibold">{student.studentId}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">Yr {student.year}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">Sec {student.section}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {student.email && <div className="truncate max-w-[160px]" title={student.email}>{student.email}</div>}
                  {student.phone && <div>{student.phone}</div>}
                  {!student.email && !student.phone && <span className="opacity-40">—</span>}
                </TableCell>
                <TableCell className="no-print">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(student)}>
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
                            Permanently delete <strong>{student.name}</strong> ({student.studentId}) and all their attendance records. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(student.id, student.name)}>Delete</AlertDialogAction>
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
      <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
        {students.length} student{students.length !== 1 ? "s" : ""} in {branchName}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [filterYear, setFilterYear] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [binarySearchType, setBinarySearchType] = useState<"id" | "name">("id");
  const [binaryHighlightIds, setBinaryHighlightIds] = useState<Set<number>>(new Set());
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
    branches?.forEach(b => queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({ branchId: b.id }) }));
  };

  const handleCreate = () => {
    if (!formData.studentId || !formData.name || !formData.branchId || !formData.year || !formData.section) {
      toast.error("Please fill in all required fields");
      return;
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
      { onSuccess: () => { invalidateAll(); toast.success("Student updated"); setEditingStudent(null); }, onError: () => toast.error("Failed to update student") }
    );
  };

  const handleDelete = (id: number, name: string) => {
    deleteStudent.mutate({ id }, {
      onSuccess: () => { invalidateAll(); toast.success(`${name} deleted`); },
      onError: () => toast.error("Failed to delete student")
    });
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({ studentId: student.studentId, name: student.name, branchId: student.branchId.toString(), year: student.year.toString(), section: student.section, phone: student.phone || "", email: student.email || "" });
  };

  const handleBinarySearch = () => {
    if (!searchQuery.trim()) { toast.error("Enter a search term first"); return; }
    if (!allStudents?.length) { toast.error("Student data not loaded yet"); return; }

    const results = binarySearchType === "id"
      ? binarySearchByStudentId(allStudents, searchQuery)
      : binarySearchByName(allStudents, searchQuery);

    if (results.length === 0) {
      toast.error(`No student found matching "${searchQuery}"`);
      setBinaryHighlightIds(new Set());
      return;
    }

    setBinaryHighlightIds(new Set(results.map(r => r.id)));
    toast.success(
      results.length === 1
        ? `Found: ${results[0].name} (${results[0].studentId})`
        : `Found ${results.length} students matching "${searchQuery}"`
    );
  };

  const clearBinaryHighlight = () => setBinaryHighlightIds(new Set());
  const hasActiveFilters = filterYear !== "all" || filterSection !== "all" || searchQuery || binaryHighlightIds.size > 0;

  return (
    <div className="space-y-5">
      {/* ── PRINT-ONLY ────────────────────────── */}
      <div className="print-only">
        <div className="flex items-center gap-4 mb-4 border-b pb-4">
          <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-16 object-contain" />
          <div>
            <h1 className="text-xl font-bold">Bangalore Technological Institute</h1>
            <p className="text-sm text-gray-600">Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
          </div>
        </div>
        <h2 className="text-base font-bold border-b pb-1 mb-1">
          Student List — {activeBranch?.name ?? "All Branches"} ({activeBranch?.code})
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Printed on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          {filterYear !== "all" ? `  ·  Year ${filterYear}` : ""}
          {filterSection !== "all" ? `  ·  Section ${filterSection}` : ""}
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th className="border border-gray-300 px-2 py-1 text-left">#</th>
              <th className="border border-gray-300 px-2 py-1 text-left">USN / ID</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Student Name</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Year</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Sec</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Phone</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {printStudents?.map((s, i) => (
              <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td className="border border-gray-200 px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-gray-200 px-2 py-1 font-mono">{s.studentId}</td>
                <td className="border border-gray-200 px-2 py-1">{s.name}</td>
                <td className="border border-gray-200 px-2 py-1 text-center">{s.year}</td>
                <td className="border border-gray-200 px-2 py-1 text-center">{s.section}</td>
                <td className="border border-gray-200 px-2 py-1">{s.phone ?? "—"}</td>
                <td className="border border-gray-200 px-2 py-1">{s.email ?? "—"}</td>
              </tr>
            ))}
            {(!printStudents || printStudents.length === 0) && (
              <tr><td colSpan={7} className="border px-2 py-4 text-center text-gray-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          <span>Total: {printStudents?.length ?? 0} students</span>
          <span>BTI Smart Attendance System</span>
        </div>
      </div>

      {/* ── SCREEN UI ─────────────────────────── */}
      <div className="no-print space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage students by branch. Use binary search to quickly locate any student.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!activeBranch}>
              <Printer className="h-4 w-4 mr-1.5" /> Print List
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
                <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleCreate} disabled={createStudent.isPending}>
                    {createStudent.isPending ? "Saving…" : "Save Student"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter panel */}
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-3 space-y-3">
            {/* Row 1: Binary search */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Search className="h-3 w-3" /> Quick Find (Binary Search)
              </p>
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1.5 flex-1 min-w-0">
                  <Input
                    placeholder={binarySearchType === "id" ? "Type student USN prefix…" : "Type name prefix…"}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setBinaryHighlightIds(new Set()); }}
                    onKeyDown={e => e.key === "Enter" && handleBinarySearch()}
                    className="flex-1 h-9 text-sm"
                  />
                  <Select value={binarySearchType} onValueChange={(v: "id" | "name") => { setBinarySearchType(v); setBinaryHighlightIds(new Set()); }}>
                    <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">By USN/ID</SelectItem>
                      <SelectItem value="name">By Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={handleBinarySearch} className="h-9">
                  <Search className="h-3.5 w-3.5 mr-1.5" /> Search
                </Button>
                {binaryHighlightIds.size > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearBinaryHighlight} className="h-9 text-muted-foreground">
                    <X className="h-3.5 w-3.5 mr-1" /> Clear ({binaryHighlightIds.size})
                  </Button>
                )}
              </div>
              {binaryHighlightIds.size > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1.5 font-medium">
                  ✓ {binaryHighlightIds.size} match{binaryHighlightIds.size !== 1 ? "es" : ""} highlighted in table below
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Row 2: Table filters */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter Table
              </p>
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1.5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Year</p>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="w-[105px] h-8 text-xs"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger className="w-[105px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                        <SelectItem value="D">Section D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => { setFilterYear("all"); setFilterSection("all"); setSearchQuery(""); setBinaryHighlightIds(new Set()); }}>
                      <X className="h-3 w-3 mr-1" /> Reset all
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch Tabs */}
        {branchesLoading ? (
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>
        ) : !branches || branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">No branches yet. Add a branch first.</p>
          </div>
        ) : (
          <Tabs defaultValue={branches[0]?.id.toString()} onValueChange={setActiveBranchId} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg w-full justify-start mb-3">
              {branches.map(branch => (
                <TabsTrigger key={branch.id} value={branch.id.toString()} className="text-xs font-semibold px-3 py-1.5">
                  {branch.code}
                </TabsTrigger>
              ))}
            </TabsList>

            {branches.map(branch => (
              <TabsContent key={branch.id} value={branch.id.toString()} className="mt-0">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-base font-semibold">{branch.name}</h2>
                  <Badge variant="outline" className="text-xs px-1.5">{branch.code}</Badge>
                </div>
                <BranchStudentTable
                  branchId={branch.id}
                  branchName={branch.name}
                  searchQuery={searchQuery}
                  filterYear={filterYear}
                  filterSection={filterSection}
                  highlightIds={binaryHighlightIds}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={open => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
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
