import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Pencil, UserPlus } from "lucide-react";
import { TeamAvatar } from "@/components/TeamAvatar";
import { getTeams, getSports, getCoaches, getVenues, createTeam, updateTeam, deleteTeam, getPlayers, addPlayerToTeam, type Team } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function TeamsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPlayerId, setAssignPlayerId] = useState("");

  const [form, setForm] = useState({ name: "", sport_id: "", coach_id: "", founded_year: "", home_venue_id: "", status: "active", team_image_url: "" });

  const { data: teams, isLoading } = useQuery({ queryKey: ["teams"], queryFn: getTeams });
  const { data: sports } = useQuery({ queryKey: ["sports"], queryFn: getSports });
  const { data: coaches } = useQuery({ queryKey: ["coaches"], queryFn: getCoaches });
  const { data: venues } = useQuery({ queryKey: ["venues"], queryFn: getVenues });
  const { data: players } = useQuery({ queryKey: ["players"], queryFn: getPlayers });

  const createMut = useMutation({
    mutationFn: createTeam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); setCreateOpen(false); toast.success("Team created"); },
    onError: () => toast.error("Failed to create team"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updateTeam(data.id, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); setCreateOpen(false); toast.success("Team updated"); },
    onError: () => toast.error("Failed to update team"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); toast.success("Team deleted"); },
    onError: () => toast.error("Failed to delete team"),
  });

  const assignMut = useMutation({
    mutationFn: (data: { teamId: number; playerId: number }) => addPlayerToTeam(data.teamId, data.playerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players"] }); qc.invalidateQueries({ queryKey: ["teams"] }); setAssignOpen(false); toast.success("Player assigned to team"); },
    onError: () => toast.error("Failed to assign player"),
  });

  const filtered = teams?.filter((t) => {
    const q = search.toLowerCase();
    return `${t.name} ${t.sport_name} ${t.coach_name} ${t.home_venue}`.toLowerCase().includes(q);
  });

  const handleSave = () => {
    const data = {
      ...form,
      sport_id: Number(form.sport_id),
      coach_id: form.coach_id ? Number(form.coach_id) : undefined,
      home_venue_id: form.home_venue_id ? Number(form.home_venue_id) : undefined,
      founded_year: form.founded_year ? Number(form.founded_year) : undefined,
      team_image_url: form.team_image_url || undefined,
    };
    if (isEdit && selectedTeamId) {
      updateMut.mutate({ id: selectedTeamId, body: data });
    } else {
      createMut.mutate(data);
    }
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedTeamId(null);
    setForm({ name: "", sport_id: "", coach_id: "", founded_year: "", home_venue_id: "", status: "active", team_image_url: "" });
    setCreateOpen(true);
  };

  const openEdit = (t: Team) => {
    setIsEdit(true);
    setSelectedTeamId(t.team_id);
    setForm({
      name: t.name || "",
      sport_id: t.sport_id ? String(t.sport_id) : "",
      coach_id: t.coach_id ? String(t.coach_id) : "",
      founded_year: t.founded_year ? String(t.founded_year) : "",
      home_venue_id: t.home_venue_id ? String(t.home_venue_id) : "",
      status: t.status || "active",
      team_image_url: t.team_image_url || "",
    });
    setCreateOpen(true);
  };

  const openAssign = (teamId: number) => {
    setSelectedTeamId(teamId);
    setAssignPlayerId("");
    setAssignOpen(true);
  };

  const handleAssign = () => {
    if (selectedTeamId && assignPlayerId) {
      assignMut.mutate({ teamId: selectedTeamId, playerId: Number(assignPlayerId) });
    }
  };
  
  const statusColor = (s: string) => {
    if (s === "active") return "bg-sport-green/20 text-sport-green border-sport-green/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout>
      <PageHeader title="Teams" description="Manage all teams and their details">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Team
        </Button>
      </PageHeader>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
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
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Sport</TableHead>
              <TableHead className="text-muted-foreground">Coach</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((t) => (
                <TableRow key={t.team_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <TeamAvatar src={t.team_image_url} alt={t.name} />
                      <div>
                        <div>{t.name}</div>
                        <div className="text-xs font-normal text-muted-foreground">{t.founded_year && `Est. ${t.founded_year}`}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{t.sport_name}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.coach_name || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Assign Player"
                        onClick={() => openAssign(t.team_id)}
                      >
                        <UserPlus size={16} className="text-sport-blue" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(t.team_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No teams found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Team" : "Add New Team"}</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={form.sport_id} onValueChange={(v) => setForm({ ...form, sport_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports?.map((s) => (
                      <SelectItem key={s.sport_id} value={String(s.sport_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coach</Label>
                <Select value={form.coach_id} onValueChange={(v) => setForm({ ...form, coach_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="No Coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches?.map((c) => (
                      <SelectItem key={c.coach_id} value={String(c.coach_id)}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Venue</Label>
                <Select value={form.home_venue_id} onValueChange={(v) => setForm({ ...form, home_venue_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues?.map((venue) => (
                      <SelectItem key={venue.venue_id} value={String(venue.venue_id)}>{venue.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team Image URL</Label>
                <Input value={form.team_image_url} onChange={(e) => setForm({ ...form, team_image_url: e.target.value })} className="bg-secondary border-border" placeholder="https://example.com/team.png" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Founded Year</Label>
                <Input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="disbanded">Disbanded</SelectItem>
                  </SelectContent>
                </Select>
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Assign Player to Team</DialogTitle>
            <DialogDescription>Select an existing player to add them to this team.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={assignPlayerId} onValueChange={setAssignPlayerId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players?.filter((p) => {
                    const selectedTeam = teams?.find((team) => team.team_id === selectedTeamId);
                    if (!selectedTeam) return p.team_id !== selectedTeamId;
                    return p.team_id !== selectedTeamId && p.sport_id === selectedTeam.sport_id;
                  }).map((p) => (
                    <SelectItem key={p.player_id} value={String(p.player_id)}>{p.first_name} {p.last_name} ({p.sport_name || 'No Sport'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assignMut.isPending || !assignPlayerId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
