import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createVenue, deleteVenue, getVenues, type Venue, updateVenue } from "@/lib/api";
import { toast } from "sonner";

export default function VenuesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: "",
    surface_type: "",
  });

  const { data: venues, isLoading } = useQuery({ queryKey: ["venues"], queryFn: getVenues });

  const createMut = useMutation({
    mutationFn: createVenue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      setCreateOpen(false);
      toast.success("Venue created");
    },
    onError: () => toast.error("Failed to create venue"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updateVenue(data.id, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      setCreateOpen(false);
      toast.success("Venue updated");
    },
    onError: () => toast.error("Failed to update venue"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Venue deleted");
    },
    onError: () => toast.error("Failed to delete venue"),
  });

  const handleSave = () => {
    const body = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : undefined,
    };

    if (isEdit && selectedVenueId) {
      updateMut.mutate({ id: selectedVenueId, body });
      return;
    }

    createMut.mutate(body);
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedVenueId(null);
    setForm({ name: "", location: "", capacity: "", surface_type: "" });
    setCreateOpen(true);
  };

  const openEdit = (venue: Venue) => {
    setIsEdit(true);
    setSelectedVenueId(venue.venue_id);
    setForm({
      name: venue.name || "",
      location: venue.location || "",
      capacity: venue.capacity ? String(venue.capacity) : "",
      surface_type: venue.surface_type || "",
    });
    setCreateOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Venues" description="Manage stadiums, courts, and playing grounds">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Venue
        </Button>
      </PageHeader>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Venue</TableHead>
              <TableHead className="text-muted-foreground">Surface</TableHead>
              <TableHead className="text-muted-foreground">Capacity</TableHead>
              <TableHead className="text-muted-foreground">Usage</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : venues && venues.length > 0 ? (
              venues.map((venue) => (
                <TableRow key={venue.venue_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <div>{venue.name}</div>
                    <div className="text-xs text-muted-foreground">{venue.location}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{venue.surface_type || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{venue.capacity ?? "-"}</TableCell>
                  <TableCell className="space-x-2">
                    <Badge variant="secondary">{venue.home_team_count ?? 0} home teams</Badge>
                    <Badge variant="secondary">{venue.scheduled_match_count ?? 0} matches</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(venue)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(venue.venue_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No venues found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Venue" : "Add Venue"}</DialogTitle>
            <DialogDescription>Track match locations and team home grounds.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Surface Type</Label>
                <Input value={form.surface_type} onChange={(e) => setForm({ ...form, surface_type: e.target.value })} className="bg-secondary border-border" />
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
