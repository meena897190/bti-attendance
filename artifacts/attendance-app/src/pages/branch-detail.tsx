import { useState } from "react";
import { useParams } from "wouter";
import { 
  useGetBranch,
  useListSubjects,
  useListStudents,
  useGetBranchStats
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const branchId = parseInt(id, 10);

  const { data: branch, isLoading: loadingBranch } = useGetBranch(branchId);
  const { data: subjects, isLoading: loadingSubjects } = useListSubjects({ branchId }, { query: { queryKey: ['listSubjects', { branchId }] } });
  const { data: students, isLoading: loadingStudents } = useListStudents({ branchId }, { query: { queryKey: ['listStudents', { branchId }] } });
  const { data: branchStats, isLoading: loadingStats } = useGetBranchStats();

  const currentStats = branchStats?.find(s => s.branchId === branchId);

  if (loadingBranch) {
    return <div className="space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[400px]" /></div>;
  }

  if (!branch) {
    return <div className="text-center py-12">Branch not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{branch.name} ({branch.code})</h1>
        <p className="text-muted-foreground">{branch.description || "No description provided."}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats?.studentCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats?.attendancePercentage.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Students in {branch.code}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>USN/ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingStudents ? (
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                  ) : students?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No students found in this branch.</TableCell></TableRow>
                  ) : (
                    students?.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell><Badge variant="outline">{student.section}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subjects for {branch.code}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSubjects ? (
                    <TableRow><TableCell colSpan={2}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                  ) : subjects?.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No subjects found in this branch.</TableCell></TableRow>
                  ) : (
                    subjects?.map(subject => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.code}</TableCell>
                        <TableCell>{subject.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
