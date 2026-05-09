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
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Users } from "lucide-react";
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
            data-testid="input-student-usn"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Doe"
            data-testid="input-student-name"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branch">Branch *</Label>
        <Select value={formData.branchId} onValueChange={(val) => setFormData(prev => ({ ...prev, branchId: val }))}>
          <SelectTrigger data-testid="select-student-branch"><SelectValue placeholder="Select Branch" /></SelectTrigger>
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
            <SelectTrigger data-testid="select-student-year"><SelectValue placeholder="Year" /></SelectTrigger>
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
            data-testid="input-student-section"
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
            data-testid="input-student-phone"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="input-student-email"
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
            <TableHead>USN / ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="w-[90px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
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
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(student)}
                    data-testid={`button-edit-student-${student.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-student-${student.id}`}
                      >
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

  const { data: branches, isLoading: branchesLoading } = useListBranches();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  // For binary search we need ALL students loaded
  const { data: allStudents } = useListStudents({}, {
    query: { queryKey: getListStudentsQueryKey({}) }
  });

  const handleCreate = () => {
    if (!formData.studentId || !formData.name || !formData.branchId || !formData.year || !formData.section) {
      toast.error("Please fill in all required fields");
      return;
    }
    createStudent.mutate(
      {
        data: {
          studentId: formData.studentId,
          name: formData.name,
          branchId: parseInt(formData.branchId, 10),
          year: parseInt(formData.year, 10),
          section: formData.section,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({}) });
          branches?.forEach(b => {
            queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({ branchId: b.id }) });
          });
          toast.success("Student added successfully");
          setIsAddOpen(false);
          setFormData(emptyForm);
        },
        onError: () => toast.error("Failed to add student"),
      }
    );
  };

  const handleUpdate = () => {
    if (!editingStudent) return;
    updateStudent.mutate(
      {
        id: editingStudent.id,
        data: {
          studentId: formData.studentId,
          name: formData.name,
          branchId: parseInt(formData.branchId, 10),
          year: parseInt(formData.year, 10),
          section: formData.section,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({}) });
          branches?.forEach(b => {
            queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({ branchId: b.id }) });
          });
          toast.success("Student updated successfully");
          setEditingStudent(null);
        },
        onError: () => toast.error("Failed to update student"),
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    deleteStudent.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({}) });
          branches?.forEach(b => {
            queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey({ branchId: b.id }) });
          });
          toast.success(`${name} deleted successfully`);
        },
        onError: () => toast.error("Failed to delete student"),
      }
    );
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      branchId: student.branchId.toString(),
      year: student.year.toString(),
      section: student.section,
      phone: student.phone || "",
      email: student.email || "",
    });
  };

  const handleBinarySearch = () => {
    if (!allStudents || !searchQuery) {
      toast.error("Enter a search term first");
      return;
    }
    // Binary search requires sorted array — O(log n)
    const result =
      binarySearchType === "id"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage student records separated by branch.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-student">
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createStudent.isPending} data-testid="button-save-student">
                {createStudent.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 border p-4 rounded-md bg-card items-end">
        <div className="flex gap-2 flex-1 min-w-[240px]">
          <Input
            placeholder="Search name or USN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
            data-testid="input-student-search"
          />
          <Select value={binarySearchType} onValueChange={(v: "id" | "name") => setBinarySearchType(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">By ID (Binary)</SelectItem>
              <SelectItem value="name">By Name (Binary)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={handleBinarySearch} data-testid="button-binary-search">
            <Search className="h-4 w-4 mr-2" /> Quick Find
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[110px]" data-testid="select-filter-year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[110px]" data-testid="select-filter-section">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
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
        <Tabs defaultValue={branches[0]?.id.toString()} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-muted p-1 rounded-lg w-full justify-start">
            {branches.map((branch) => (
              <TabsTrigger
                key={branch.id}
                value={branch.id.toString()}
                className="text-xs sm:text-sm font-medium px-3 py-1.5"
                data-testid={`tab-branch-${branch.id}`}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <StudentForm formData={formData} setFormData={setFormData} branches={branches} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateStudent.isPending} data-testid="button-update-student">
              {updateStudent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
