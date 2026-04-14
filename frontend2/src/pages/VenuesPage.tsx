import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, ArrowUp, Search, ArrowDown } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: "",
    surface_type: "",
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

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

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (!sortConfig || sortConfig.key !== column) return <ArrowUp size={14} className="ml-1 opacity-20" />;
    return sortConfig.direction === "asc" ? <ArrowUp size={14} className="ml-1 text-primary" /> : <ArrowDown size={14} className="ml-1 text-primary" />;
  };

  const filtered = venues?.filter((venue) => {
    const q = search.toLowerCase();
    return `${venue.name} ${venue.location} ${venue.surface_type || ""} ${venue.capacity || ""}`
      .toLowerCase()
      .includes(q);
  });

  const sortedVenues = [...(filtered || [])].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let aValue: any = a[key as keyof Venue];
    let bValue: any = b[key as keyof Venue];

    if (key === 'capacity') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    } else {
      aValue = (aValue || "").toString().toLowerCase();
      bValue = (bValue || "").toString().toLowerCase();
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <AppLayout>
      <PageHeader title="Venues" description="Manage stadiums, courts, and playing grounds">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Venue
        </Button>
      </PageHeader>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">Venue <SortIcon column="name" /></div>
              </TableHead>
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('surface_type')}
              >
                <div className="flex items-center">Surface <SortIcon column="surface_type" /></div>
              </TableHead>
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('capacity')}
              >
                <div className="flex items-center">Capacity <SortIcon column="capacity" /></div>
              </TableHead>
              <TableHead className="text-muted-foreground">Usage</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : sortedVenues && sortedVenues.length > 0 ? (
              sortedVenues.map((venue) => (
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
