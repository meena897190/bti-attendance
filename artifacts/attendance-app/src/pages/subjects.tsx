import { useState } from "react";
import { 
  useListSubjects, 
  useCreateSubject, 
  useUpdateSubject, 
  useDeleteSubject,
  useListBranches,
  getListSubjectsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [filterBranchId, setFilterBranchId] = useState<string>("all");
  
  const { data: branches } = useListBranches();
  
  const queryParams = filterBranchId !== "all" ? { branchId: parseInt(filterBranchId, 10) } : {};
  const { data: subjects, isLoading } = useListSubjects(queryParams, { query: { queryKey: getListSubjectsQueryKey(queryParams) } });
  
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", branchId: "" });
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const handleCreate = () => {
    if (!formData.name || !formData.code || !formData.branchId) {
      toast.error("All fields are required");
      return;
    }
    createSubject.mutate(
      { data: { name: formData.name, code: formData.code, branchId: parseInt(formData.branchId, 10) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
          toast.success("Subject created successfully");
          setIsAddOpen(false);
          setFormData({ name: "", code: "", branchId: "" });
        },
        onError: () => toast.error("Failed to create subject")
      }
    );
  };

  const handleUpdate = () => {
    if (!editingSubject) return;
    updateSubject.mutate(
      { id: editingSubject.id, data: { name: formData.name, code: formData.code, branchId: parseInt(formData.branchId, 10) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
          toast.success("Subject updated successfully");
          setEditingSubject(null);
        },
        onError: () => toast.error("Failed to update subject")
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteSubject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
          toast.success("Subject deleted successfully");
        },
        onError: () => toast.error("Failed to delete subject")
      }
    );
  };

  const openEdit = (subject: any) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, code: subject.code, branchId: subject.branchId.toString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage subjects across branches.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterBranchId} onValueChange={setFilterBranchId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches?.map(b => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={formData.branchId} onValueChange={(val) => setFormData(prev => ({ ...prev, branchId: val }))}>
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
                  <Label htmlFor="code">Subject Code</Label>
                  <Input id="code" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="CS101" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Data Structures" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createSubject.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : subjects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No subjects found.
                </TableCell>
              </TableRow>
            ) : (
              subjects?.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.code}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell><Badge variant="secondary">{subject.branchName}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(subject)}>
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
                              This will permanently delete {subject.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(subject.id)}>Delete</AlertDialogAction>
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

      <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Select value={formData.branchId} onValueChange={(val) => setFormData(prev => ({ ...prev, branchId: val }))}>
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
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input id="edit-code" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubject(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateSubject.isPending}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
