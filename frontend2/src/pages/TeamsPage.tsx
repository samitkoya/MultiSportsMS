import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { TeamAvatar } from "@/components/TeamAvatar";
import {
  addPlayerToTeam,
  createTeam,
  deleteTeam,
  getCoaches,
  getPlayers,
  getSports,
  getTeams,
  getVenues,
  updateTeam,
  type Team,
} from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type TeamForm = {
  name: string;
  sport_id: string;
  coach_id: string;
  founded_year: string;
  home_venue_id: string;
  status: string;
  team_image_url: string;
};

type AssignForm = {
  player_id: string;
  membership_type: string;
  jersey_number: string;
  position: string;
  start_date: string;
  notes: string;
};

const emptyTeamForm = (): TeamForm => ({
  name: "",
  sport_id: "",
  coach_id: "",
  founded_year: "",
  home_venue_id: "",
  status: "active",
  team_image_url: "",
});

const emptyAssignForm = (): AssignForm => ({
  player_id: "",
  membership_type: "club",
  jersey_number: "",
  position: "",
  start_date: "",
  notes: "",
});

export default function TeamsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [form, setForm] = useState<TeamForm>(emptyTeamForm);
  const [assignForm, setAssignForm] = useState<AssignForm>(emptyAssignForm);

  const { data: teams, isLoading } = useQuery({ queryKey: ["teams"], queryFn: getTeams });
  const { data: sports } = useQuery({ queryKey: ["sports"], queryFn: getSports });
  const { data: coaches } = useQuery({ queryKey: ["coaches"], queryFn: getCoaches });
  const { data: venues } = useQuery({ queryKey: ["venues"], queryFn: getVenues });
  const { data: players } = useQuery({ queryKey: ["players"], queryFn: getPlayers });

  const createMut = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      setCreateOpen(false);
      toast.success("Team created");
    },
    onError: () => toast.error("Failed to create team"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updateTeam(data.id, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      setCreateOpen(false);
      toast.success("Team updated");
    },
    onError: () => toast.error("Failed to update team"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["players"] });
      toast.success("Team deleted");
    },
    onError: () => toast.error("Failed to delete team"),
  });

  const assignMut = useMutation({
    mutationFn: (data: {
      teamId: number;
      body: {
        player_id: number;
        jersey_number?: number;
        position?: string;
        membership_type?: string;
        start_date?: string;
        notes?: string;
      };
    }) => addPlayerToTeam(data.teamId, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      setAssignOpen(false);
      toast.success("Player assigned to team");
    },
    onError: (error) => toast.error(error.message || "Failed to assign player"),
  });

  const filtered = teams?.filter((team) => {
    const q = search.toLowerCase();
    return `${team.name} ${team.sport_name} ${team.coach_name} ${team.home_venue}`.toLowerCase().includes(q);
  });

  const selectedTeam = teams?.find((team) => team.team_id === selectedTeamId) || null;

  const assignablePlayers = players?.filter((player) => {
    if (!selectedTeam) return false;
    const hasActiveMembershipForTeam = player.memberships.some(
      (membership) => membership.is_active && membership.team_id === selectedTeam.team_id,
    );
    const activeSportIds = [...new Set(player.memberships.filter((membership) => membership.is_active).map((membership) => membership.sport_id))];

    if (hasActiveMembershipForTeam) return false;
    if (activeSportIds.length === 0) return true;
    return activeSportIds.every((sportId) => sportId === selectedTeam.sport_id);
  });

  const handleSave = () => {
    const payload = {
      ...form,
      sport_id: Number(form.sport_id),
      coach_id: form.coach_id ? Number(form.coach_id) : undefined,
      home_venue_id: form.home_venue_id ? Number(form.home_venue_id) : undefined,
      founded_year: form.founded_year ? Number(form.founded_year) : undefined,
      team_image_url: form.team_image_url || undefined,
    };

    if (isEdit && selectedTeamId) {
      updateMut.mutate({ id: selectedTeamId, body: payload });
      return;
    }

    createMut.mutate(payload);
  };

  const handleAssign = () => {
    if (!selectedTeamId || !assignForm.player_id) return;

    assignMut.mutate({
      teamId: selectedTeamId,
      body: {
        player_id: Number(assignForm.player_id),
        membership_type: assignForm.membership_type,
        jersey_number: assignForm.jersey_number ? Number(assignForm.jersey_number) : undefined,
        position: assignForm.position || undefined,
        start_date: assignForm.start_date || undefined,
        notes: assignForm.notes || undefined,
      },
    });
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedTeamId(null);
    setForm(emptyTeamForm());
    setCreateOpen(true);
  };

  const openEdit = (team: Team) => {
    setIsEdit(true);
    setSelectedTeamId(team.team_id);
    setForm({
      name: team.name || "",
      sport_id: team.sport_id ? String(team.sport_id) : "",
      coach_id: team.coach_id ? String(team.coach_id) : "",
      founded_year: team.founded_year ? String(team.founded_year) : "",
      home_venue_id: team.home_venue_id ? String(team.home_venue_id) : "",
      status: team.status || "active",
      team_image_url: team.team_image_url || "",
    });
    setCreateOpen(true);
  };

  const openAssign = (teamId: number) => {
    setSelectedTeamId(teamId);
    setAssignForm(emptyAssignForm());
    setAssignOpen(true);
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-sport-green/20 text-sport-green border-sport-green/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout>
      <PageHeader title="Teams" description="Manage teams, visuals, and roster memberships">
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
              <TableHead className="text-muted-foreground">Players</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((team) => (
                <TableRow key={team.team_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <TeamAvatar src={team.team_image_url} alt={team.name} />
                      <div>
                        <div>{team.name}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {team.founded_year ? `Est. ${team.founded_year}` : "Year unknown"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{team.sport_name}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{team.coach_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{team.player_count ?? 0}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(team.status)}`}>
                      {team.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Assign Player" onClick={() => openAssign(team.team_id)}>
                        <UserPlus size={16} className="text-sport-blue" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(team)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(team.team_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No teams found</TableCell>
              </TableRow>
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
              <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="bg-secondary border-border" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={form.sport_id} onValueChange={(value) => setForm((current) => ({ ...current, sport_id: value }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports?.map((sport) => (
                      <SelectItem key={sport.sport_id} value={String(sport.sport_id)}>{sport.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coach</Label>
                <Select value={form.coach_id || "none"} onValueChange={(value) => setForm((current) => ({ ...current, coach_id: value === "none" ? "" : value }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="No Coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Coach</SelectItem>
                    {coaches?.map((coach) => (
                      <SelectItem key={coach.coach_id} value={String(coach.coach_id)}>{coach.first_name} {coach.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Venue</Label>
                <Select value={form.home_venue_id || "none"} onValueChange={(value) => setForm((current) => ({ ...current, home_venue_id: value === "none" ? "" : value }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Home Venue</SelectItem>
                    {venues?.map((venue) => (
                      <SelectItem key={venue.venue_id} value={String(venue.venue_id)}>{venue.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team Image URL</Label>
                <Input value={form.team_image_url} onChange={(e) => setForm((current) => ({ ...current, team_image_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://example.com/team.png" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Founded Year</Label>
                  <Input type="number" value={form.founded_year} onChange={(e) => setForm((current) => ({ ...current, founded_year: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
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
            <DialogDescription>
              Create a team-specific membership with its own jersey number and position.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={assignForm.player_id} onValueChange={(value) => setAssignForm((current) => ({ ...current, player_id: value }))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {assignablePlayers?.map((player) => (
                    <SelectItem key={player.player_id} value={String(player.player_id)}>
                      {player.first_name} {player.last_name} ({player.team_names || "No active team"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Membership Type</Label>
                <Select value={assignForm.membership_type} onValueChange={(value) => setAssignForm((current) => ({ ...current, membership_type: value }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="academy">Academy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jersey Number</Label>
                <Input type="number" value={assignForm.jersey_number} onChange={(e) => setAssignForm((current) => ({ ...current, jersey_number: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={assignForm.position} onChange={(e) => setAssignForm((current) => ({ ...current, position: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={assignForm.start_date} onChange={(e) => setAssignForm((current) => ({ ...current, start_date: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={assignForm.notes} onChange={(e) => setAssignForm((current) => ({ ...current, notes: e.target.value }))} className="bg-secondary border-border" placeholder="Optional context like vice-captain or youth call-up" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assignMut.isPending || !assignForm.player_id}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}