import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { CoachAvatar } from "@/components/CoachAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createCoach, deleteCoach, getCoaches, type Coach, updateCoach } from "@/lib/api";
import { toast } from "sonner";

export default function CoachesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: "",
    experience_years: "",
    coach_image_url: "",
  });

  const { data: coaches, isLoading } = useQuery({ queryKey: ["coaches"], queryFn: getCoaches });

  const createMut = useMutation({
    mutationFn: createCoach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaches"] });
      setCreateOpen(false);
      toast.success("Coach created");
    },
    onError: () => toast.error("Failed to create coach"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updateCoach(data.id, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaches"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      setCreateOpen(false);
      toast.success("Coach updated");
    },
    onError: () => toast.error("Failed to update coach"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCoach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaches"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Coach deleted");
    },
    onError: () => toast.error("Failed to delete coach"),
  });

  const handleSave = () => {
    const body = {
      ...form,
      experience_years: form.experience_years ? Number(form.experience_years) : undefined,
    };

    if (isEdit && selectedCoachId) {
      updateMut.mutate({ id: selectedCoachId, body });
      return;
    }

    createMut.mutate(body);
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedCoachId(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", specialization: "", experience_years: "", coach_image_url: "" });
    setCreateOpen(true);
  };

  const openEdit = (coach: Coach) => {
    setIsEdit(true);
    setSelectedCoachId(coach.coach_id);
    setForm({
      first_name: coach.first_name || "",
      last_name: coach.last_name || "",
      email: coach.email || "",
      phone: coach.phone || "",
      specialization: coach.specialization || "",
      experience_years: coach.experience_years ? String(coach.experience_years) : "",
      coach_image_url: coach.coach_image_url || "",
    });
    setCreateOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Coaches" description="Manage coaching staff and their assignments">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Coach
        </Button>
      </PageHeader>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Coach</TableHead>
              <TableHead className="text-muted-foreground">Specialization</TableHead>
              <TableHead className="text-muted-foreground">Experience</TableHead>
              <TableHead className="text-muted-foreground">Teams</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : coaches && coaches.length > 0 ? (
              coaches.map((coach) => (
                <TableRow key={coach.coach_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <CoachAvatar src={coach.coach_image_url} alt={coach.first_name} />
                      <div>
                        <div>{coach.first_name} {coach.last_name}</div>
                        <div className="text-xs text-muted-foreground">{coach.email || "No email"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{coach.specialization || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{coach.experience_years} yrs</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{coach.team_count ?? 0} teams</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(coach)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(coach.coach_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No coaches found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Coach" : "Add Coach"}</DialogTitle>
            <DialogDescription>Keep staff details accurate.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Experience Years</Label>
                <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coach Image URL</Label>
                <Input value={form.coach_image_url} onChange={(e) => setForm({ ...form, coach_image_url: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
