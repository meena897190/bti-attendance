import { useState, useRef } from "react";
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
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Users, Building2, Printer } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { binarySearchByStudentId, binarySearchByName } from "@/lib/binary-search";

type StudentFormData = {
  studentId: string;
  name: string;
  branchId: string;
  year: string;
  section: string;
  phone: string;
  email: string;
};

const emptyForm: StudentFormData = {
  studentId: "", name: "", branchId: "", year: "", section: "", phone: "", email: ""
};

function StudentForm({
  formData,
  setFormData,
  branches,
}: {
  formData: StudentFormData;
  setFormData: (fn: (prev: StudentFormData) => StudentFormData) => void;
  branches: { id: number; name: string }[] | undefined;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="studentId">USN / ID *</Label>
          <Input
            id="studentId"
            value={formData.studentId}
            onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
            placeholder="1BT20CS001"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branch">Branch *</Label>
        <Select value={formData.branchId} onValueChange={(val) => setFormData(prev => ({ ...prev, branchId: val }))}>
          <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
          <SelectContent>
            {branches?.map(b => (
              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="year">Year *</Label>
          <Select value={formData.year} onValueChange={(val) => setFormData(prev => ({ ...prev, year: val }))}>
            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="section">Section *</Label>
          <Input
            id="section"
            value={formData.section}
            onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
            placeholder="A"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

function BranchStudentTable({
  branchId,
  branchName,
  searchQuery,
  filterYear,
  filterSection,
  onEdit,
  onDelete,
}: {
  branchId: number;
  branchName: string;
  searchQuery: string;
  filterYear: string;
  filterSection: string;
  onEdit: (student: any) => void;
  onDelete: (id: number, name: string) => void;
}) {
  const params = {
    branchId,
    ...(filterYear !== "all" && { year: parseInt(filterYear, 10) }),
    ...(filterSection !== "all" && { section: filterSection }),
    ...(searchQuery && { search: searchQuery }),
  };

  const { data: students, isLoading } = useListStudents(params, {
    query: { queryKey: getListStudentsQueryKey(params) }
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Users className="h-8 w-8 opacity-40" />
        <p className="text-sm">No students in {branchName} matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead>USN / ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="w-[90px] text-right no-print">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, idx) => (
            <TableRow key={student.id}>
              <TableCell className="text-center text-muted-foreground text-sm">{idx + 1}</TableCell>
              <TableCell className="font-mono text-sm font-medium">{student.studentId}</TableCell>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>
                <Badge variant="outline">Year {student.year}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">Sec {student.section}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                {student.email && (
                  <div className="truncate" title={student.email}>{student.email}</div>
                )}
                {student.phone && <div>{student.phone}</div>}
                {!student.email && !student.phone && <span className="opacity-40">—</span>}
              </TableCell>
              <TableCell className="no-print">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(student)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{student.name}</strong> ({student.studentId}) and all their attendance records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => onDelete(student.id, student.name)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [binarySearchType, setBinarySearchType] = useState<"id" | "name">("id");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>(emptyForm);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [activeBranchId, setActiveBranchId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: branches, isLoading: branchesLoading } = useListBranches();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const { data: allStudents } = useListStudents({}, {
    query: { queryKey: getListStudentsQueryKey({}) }
  });

  const activeBranch = branches?.find(b => b.id.toString() === activeBranchId) ?? branches?.[0];

  const printParams = activeBranch ? {
    branchId: activeBranch.id,
    ...(filterYear !== "all" && { year: parseInt(filterYear, 10) }),
    ...(filterSection !== "all" && { section: filterSection }),
  } : undefined;

  const { data: printStudents } = useListStudents(printParams ?? {}, {
    query: {
      enabled: !!activeBranch,
      queryKey: getListStudentsQueryKey(printParams ?? {})
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({}) });
    branches?.forEach(b => {
      queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({ branchId: b.id }) });
    });
  };

  const handleCreate = () => {
    if (!formData.studentId || !formData.name || !formData.branchId || !formData.year || !formData.section) {
      toast.error("Please fill in all required fields");
      return;
    }
    createStudent.mutate(
      { data: { studentId: formData.studentId, name: formData.name, branchId: parseInt(formData.branchId, 10), year: parseInt(formData.year, 10), section: formData.section, phone: formData.phone || undefined, email: formData.email || undefined } },
      {
        onSuccess: () => { invalidateAll(); toast.success("Student added successfully"); setIsAddOpen(false); setFormData(emptyForm); },
        onError: () => toast.error("Failed to add student"),
      }
    );
  };

  const handleUpdate = () => {
    if (!editingStudent) return;
    updateStudent.mutate(
      { id: editingStudent.id, data: { studentId: formData.studentId, name: formData.name, branchId: parseInt(formData.branchId, 10), year: parseInt(formData.year, 10), section: formData.section, phone: formData.phone || undefined, email: formData.email || undefined } },
      {
        onSuccess: () => { invalidateAll(); toast.success("Student updated successfully"); setEditingStudent(null); },
        onError: () => toast.error("Failed to update student"),
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    deleteStudent.mutate(
      { id },
      {
        onSuccess: () => { invalidateAll(); toast.success(`${name} deleted successfully`); },
        onError: () => toast.error("Failed to delete student"),
      }
    );
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({ studentId: student.studentId, name: student.name, branchId: student.branchId.toString(), year: student.year.toString(), section: student.section, phone: student.phone || "", email: student.email || "" });
  };

  const handleBinarySearch = () => {
    if (!allStudents || !searchQuery) { toast.error("Enter a search term first"); return; }
    const result = binarySearchType === "id"
      ? binarySearchByStudentId(allStudents, searchQuery)
      : binarySearchByName(allStudents, searchQuery);
    if (result) {
      toast.success(`Found: ${result.name} (${result.studentId}) — ${result.branchName}, Year ${result.year} Sec ${result.section}`);
    } else {
      toast.error("Student not found via binary search");
    }
  };

  return (
    <div className="space-y-6">

      {/* ── PRINT-ONLY HEADER ─────────────────────────────────────── */}
      <div className="hidden print:block mb-6">
        <div className="flex items-center gap-4 mb-4">
          <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-16 object-contain" />
          <div>
            <h1 className="text-xl font-bold">Bangalore Technological Institute</h1>
            <p className="text-sm text-gray-600">Affiliated to VTU, Belagavi | Accredited by NAAC | ISO Certified</p>
          </div>
        </div>
        <h2 className="text-lg font-semibold border-b pb-2 mb-1">
          Student List — {activeBranch?.name ?? "All Branches"}
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Printed on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          {filterYear !== "all" ? ` · Year ${filterYear}` : ""}
          {filterSection !== "all" ? ` · Section ${filterSection}` : ""}
        </p>
        {/* Print table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">#</th>
              <th className="border px-2 py-1 text-left">USN / ID</th>
              <th className="border px-2 py-1 text-left">Name</th>
              <th className="border px-2 py-1 text-left">Year</th>
              <th className="border px-2 py-1 text-left">Section</th>
              <th className="border px-2 py-1 text-left">Phone</th>
              <th className="border px-2 py-1 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {printStudents?.map((s, i) => (
              <tr key={s.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <td className="border px-2 py-1">{i + 1}</td>
                <td className="border px-2 py-1 font-mono">{s.studentId}</td>
                <td className="border px-2 py-1">{s.name}</td>
                <td className="border px-2 py-1">{s.year}</td>
                <td className="border px-2 py-1">{s.section}</td>
                <td className="border px-2 py-1">{s.phone ?? "—"}</td>
                <td className="border px-2 py-1">{s.email ?? "—"}</td>
              </tr>
            ))}
            {(!printStudents || printStudents.length === 0) && (
              <tr><td colSpan={7} className="border px-2 py-4 text-center text-gray-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4 text-right">Total: {printStudents?.length ?? 0} students</p>
      </div>

      {/* ── SCREEN UI ─────────────────────────────────────────────── */}
      <div className="no-print space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">Manage student records, separated by branch.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={!activeBranch}>
              <Printer className="mr-2 h-4 w-4" /> Print List
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
                <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createStudent.isPending}>
                    {createStudent.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-2 border p-4 rounded-md bg-card items-center">
          <div className="flex gap-2 flex-1 min-w-[220px]">
            <Input
              placeholder="Search name or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Select value={binarySearchType} onValueChange={(v: "id" | "name") => setBinarySearchType(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="id">By ID (Binary)</SelectItem>
                <SelectItem value="name">By Name (Binary)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={handleBinarySearch}>
              <Search className="h-4 w-4 mr-2" /> Quick Find
            </Button>
          </div>
          <div className="flex gap-2">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Section" /></SelectTrigger>
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

        {/* Branch Tabs */}
        {branchesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !branches || branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <Building2 className="h-10 w-10 opacity-30" />
            <p>No branches found. Add branches first before managing students.</p>
          </div>
        ) : (
          <Tabs
            defaultValue={branches[0]?.id.toString()}
            onValueChange={setActiveBranchId}
            className="w-full"
          >
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-muted p-1 rounded-lg w-full justify-start">
              {branches.map((branch) => (
                <TabsTrigger
                  key={branch.id}
                  value={branch.id.toString()}
                  className="text-xs sm:text-sm font-medium px-3 py-1.5"
                >
                  {branch.code}
                </TabsTrigger>
              ))}
            </TabsList>

            {branches.map((branch) => (
              <TabsContent key={branch.id} value={branch.id.toString()} className="mt-0">
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{branch.name}</h2>
                  <Badge variant="outline" className="text-xs">{branch.code}</Badge>
                </div>
                <BranchStudentTable
                  branchId={branch.id}
                  branchName={branch.name}
                  searchQuery={searchQuery}
                  filterYear={filterYear}
                  filterSection={filterSection}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateStudent.isPending}>
              {updateStudent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
