import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { binarySearchByStudentId, binarySearchByName } from "@/lib/binary-search";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [filterBranchId, setFilterBranchId] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [binarySearchType, setBinarySearchType] = useState<"id" | "name">("id");
  const [binarySearchResult, setBinarySearchResult] = useState<any>(null);
  
  const { data: branches } = useListBranches();
  
  const queryParams = {
    ...(filterBranchId !== "all" && { branchId: parseInt(filterBranchId, 10) }),
    ...(filterYear !== "all" && { year: parseInt(filterYear, 10) }),
    ...(filterSection !== "all" && { section: filterSection }),
    ...(searchQuery && { search: searchQuery })
  };
  
  const { data: students, isLoading } = useListStudents(queryParams, { query: { queryKey: getListStudentsQueryKey(queryParams) } });
  
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ studentId: "", name: "", branchId: "", year: "", section: "", phone: "", email: "" });
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const handleCreate = () => {
    if (!formData.studentId || !formData.name || !formData.branchId || !formData.year || !formData.section) {
      toast.error("Required fields missing");
      return;
    }
    createStudent.mutate(
      { data: { 
        studentId: formData.studentId, 
        name: formData.name, 
        branchId: parseInt(formData.branchId, 10),
        year: parseInt(formData.year, 10),
        section: formData.section,
        phone: formData.phone || undefined,
        email: formData.email || undefined
      } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/students'] });
          toast.success("Student created successfully");
          setIsAddOpen(false);
          setFormData({ studentId: "", name: "", branchId: "", year: "", section: "", phone: "", email: "" });
        },
        onError: () => toast.error("Failed to create student")
      }
    );
  };

  const handleUpdate = () => {
    if (!editingStudent) return;
    updateStudent.mutate(
      { id: editingStudent.id, data: { 
        studentId: formData.studentId, 
        name: formData.name, 
        branchId: parseInt(formData.branchId, 10),
        year: parseInt(formData.year, 10),
        section: formData.section,
        phone: formData.phone || undefined,
        email: formData.email || undefined
      } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/students'] });
          toast.success("Student updated successfully");
          setEditingStudent(null);
        },
        onError: () => toast.error("Failed to update student")
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteStudent.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/students'] });
          toast.success("Student deleted successfully");
        },
        onError: () => toast.error("Failed to delete student")
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
      email: student.email || ""
    });
  };

  const handleBinarySearch = () => {
    if (!students || !searchQuery) return;
    let result;
    if (binarySearchType === "id") {
      result = binarySearchByStudentId(students, searchQuery);
    } else {
      result = binarySearchByName(students, searchQuery);
    }
    
    if (result) {
      toast.success(`Found: ${result.name} (${result.studentId})`);
      // We could highlight the row, but let's just show a toast
    } else {
      toast.error("Student not found using binary search");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage student records and information.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="studentId">USN / ID *</Label>
                  <Input id="studentId" value={formData.studentId} onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))} placeholder="1BT20CS001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="John Doe" />
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
                  <Input id="section" value={formData.section} onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))} placeholder="A" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createStudent.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 border p-4 rounded-md bg-card">
        <div className="flex-1 flex gap-2">
          <Input 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={binarySearchType} onValueChange={(v: "id" | "name") => setBinarySearchType(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">By ID (Binary)</SelectItem>
              <SelectItem value="name">By Name (Binary)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={handleBinarySearch}><Search className="h-4 w-4 mr-2" /> Quick Find</Button>
        </div>
        <div className="flex gap-2">
          <Select value={filterBranchId} onValueChange={setFilterBranchId}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches?.map(b => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>USN/ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Yr/Sec</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : students?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No students found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              students?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell><Badge variant="secondary">{student.branchName}</Badge></TableCell>
                  <TableCell>Y{student.year} - {student.section}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.email && <div className="truncate w-32" title={student.email}>{student.email}</div>}
                    {student.phone && <div>{student.phone}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(student)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {student.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(student.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-studentId">USN / ID *</Label>
                  <Input id="edit-studentId" value={formData.studentId} onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input id="edit-name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-branch">Branch *</Label>
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
                  <Label htmlFor="edit-year">Year *</Label>
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
                  <Label htmlFor="edit-section">Section *</Label>
                  <Input id="edit-section" value={formData.section} onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateStudent.isPending}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
