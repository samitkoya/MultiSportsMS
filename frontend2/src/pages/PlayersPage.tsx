import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  type Player,
  createPlayer,
  deletePlayer,
  getPlayerStats,
  getPlayers,
  getTeams,
  updatePlayer,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type MembershipForm = {
  team_id: string;
  membership_type: string;
  jersey_number: string;
  position: string;
  start_date: string;
  notes: string;
};

type PlayerForm = {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  memberships: MembershipForm[];
};

const emptyMembership = (): MembershipForm => ({
  team_id: "",
  membership_type: "club",
  jersey_number: "",
  position: "",
  start_date: "",
  notes: "",
});

const emptyForm = (): PlayerForm => ({
  first_name: "",
  last_name: "",
  email: "",
  date_of_birth: "",
  gender: "",
  memberships: [emptyMembership()],
});

export default function PlayersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState("");
  const [form, setForm] = useState<PlayerForm>(emptyForm);

  const { data: players, isLoading } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: getTeams });
  const { data: playerStats, isLoading: loadingStats } = useQuery({
    queryKey: ["player-stats", selectedPlayerId],
    queryFn: () => getPlayerStats(selectedPlayerId!),
    enabled: !!selectedPlayerId,
  });

  const createMut = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      setCreateOpen(false);
      toast.success("Player created");
    },
    onError: (error) => toast.error(error.message || "Failed to create player"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updatePlayer(data.id, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      setCreateOpen(false);
      toast.success("Player updated");
    },
    onError: (error) => toast.error(error.message || "Failed to update player"),
  });

  const deleteMut = useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player deleted");
    },
    onError: () => toast.error("Failed to delete player"),
  });

  const filtered = players?.filter((player) => {
    const q = search.toLowerCase();
    const membershipText = player.memberships
      .map((membership) => `${membership.team_name} ${membership.membership_type} ${membership.position || ""}`)
      .join(" ");

    return `${player.first_name} ${player.last_name} ${player.email || ""} ${player.team_names} ${membershipText}`
      .toLowerCase()
      .includes(q);
  });

  const statusColor = (status: string) => {
    if (status === "active") return "bg-sport-green/20 text-sport-green border-sport-green/30";
    if (status === "injured") return "bg-sport-red/20 text-sport-red border-sport-red/30";
    return "bg-muted text-muted-foreground";
  };

  const formatStatKey = (key: string) =>
    key.replace(/^total_/, "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const updateMembership = (index: number, key: keyof MembershipForm, value: string) => {
    setForm((current) => ({
      ...current,
      memberships: current.memberships.map((membership, currentIndex) =>
        currentIndex === index ? { ...membership, [key]: value } : membership,
      ),
    }));
  };

  const addMembership = () => {
    setForm((current) => ({
      ...current,
      memberships: [...current.memberships, emptyMembership()],
    }));
  };

  const removeMembership = (index: number) => {
    setForm((current) => ({
      ...current,
      memberships:
        current.memberships.length === 1
          ? [emptyMembership()]
          : current.memberships.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const buildPayload = () => ({
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email || undefined,
    date_of_birth: form.date_of_birth || undefined,
    gender: form.gender || undefined,
    memberships: form.memberships
      .filter((membership) => membership.team_id)
      .map((membership) => ({
        team_id: Number(membership.team_id),
        membership_type: membership.membership_type,
        jersey_number: membership.jersey_number ? Number(membership.jersey_number) : undefined,
        position: membership.position || undefined,
        start_date: membership.start_date || undefined,
        notes: membership.notes || undefined,
      })),
  });

  const handleSave = () => {
    const payload = buildPayload();
    if (isEdit && selectedPlayerId) {
    updateMut.mutate({ id: selectedPlayerId, body: payload });
      return;
    }
    createMut.mutate(payload);
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedPlayerId(null);
    setForm(emptyForm());
    setCreateOpen(true);
  };

  const openEdit = (player: Player) => {
    const activeMemberships = player.memberships
      .filter((membership) => membership.is_active)
      .map((membership) => ({
        team_id: String(membership.team_id),
        membership_type: membership.membership_type,
        jersey_number: membership.jersey_number ? String(membership.jersey_number) : "",
        position: membership.position || "",
        start_date: membership.start_date || "",
        notes: membership.notes || "",
      }));

    setIsEdit(true);
    setSelectedPlayerId(player.player_id);
    setForm({
      first_name: player.first_name || "",
      last_name: player.last_name || "",
      email: player.email || "",
      date_of_birth: player.date_of_birth ? new Date(player.date_of_birth).toISOString().split("T")[0] : "",
      gender: player.gender || "",
      memberships: activeMemberships.length > 0 ? activeMemberships : [emptyMembership()],
    });
    setCreateOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Players" description="Manage player profiles and memberships across teams">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Player
        </Button>
      </PageHeader>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players..."
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
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Teams</TableHead>
              <TableHead className="text-muted-foreground">Active Memberships</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((player) => (
                <TableRow key={player.player_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <div>{player.first_name} {player.last_name}</div>
                    <div className="text-xs text-muted-foreground">{player.email || "No email"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{player.team_names || "Unassigned"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {player.memberships.filter((membership) => membership.is_active).length > 0 ? (
                      <div className="space-y-1">
                        {player.memberships
                          .filter((membership) => membership.is_active)
                          .map((membership) => (
                            <div key={membership.membership_id ?? `${membership.team_id}-${membership.membership_type}`} className="text-xs">
                              {membership.membership_type}: {membership.team_name}
                              {membership.jersey_number ? ` #${membership.jersey_number}` : ""}
                              {membership.position ? ` - ${membership.position}` : ""}
                            </div>
                          ))}
                      </div>
                    ) : (
                      "No active memberships"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(player.status)}`}>
                      {player.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPlayerId(player.player_id);
                          setSelectedPlayerName(`${player.first_name} ${player.last_name}`);
                          setStatsOpen(true);
                        }}
                      >
                        <BarChart3 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(player)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(player.player_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No players found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto border-border sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Player" : "Add New Player"}</DialogTitle>
            <DialogDescription>
              Player profiles can hold multiple active memberships such as club and country teams.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm((current) => ({ ...current, first_name: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm((current) => ({ ...current, last_name: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input value={form.gender} onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm((current) => ({ ...current, date_of_birth: e.target.value }))} className="bg-secondary border-border" />
            </div>

            <div className="space-y-4 rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Active Memberships</h3>
                  <p className="text-xs text-muted-foreground">Add one row for each team context this player currently belongs to.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMembership} className="gap-2">
                  <Plus size={14} /> Add Membership
                </Button>
              </div>

              {form.memberships.map((membership, index) => (
                <div key={`${index}-${membership.team_id}-${membership.membership_type}`} className="grid gap-4 rounded-lg border border-border/60 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Membership {index + 1}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMembership(index)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Team</Label>
                      <Select value={membership.team_id} onValueChange={(value) => updateMembership(index, "team_id", value)}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams?.map((team) => (
                            <SelectItem key={team.team_id} value={String(team.team_id)}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Membership Type</Label>
                      <Select value={membership.membership_type} onValueChange={(value) => updateMembership(index, "membership_type", value)}>
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
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Jersey Number</Label>
                      <Input type="number" value={membership.jersey_number} onChange={(e) => updateMembership(index, "jersey_number", e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input value={membership.position} onChange={(e) => updateMembership(index, "position", e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={membership.start_date} onChange={(e) => updateMembership(index, "start_date", e.target.value)} className="bg-secondary border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={membership.notes} onChange={(e) => updateMembership(index, "notes", e.target.value)} className="bg-secondary border-border" placeholder="Optional context like captaincy or squad role" />
                  </div>
                </div>
              ))}
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

      <Dialog
        open={statsOpen}
        onOpenChange={(open) => {
          setStatsOpen(open);
          if (!open) setSelectedPlayerId(null);
        }}
      >
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Stats - {selectedPlayerName}</DialogTitle>
            <DialogDescription>Performance statistics across matches.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingStats ? (
              <p className="py-4 text-center text-muted-foreground">Loading stats...</p>
            ) : playerStats ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary p-4">
                  {Object.entries(playerStats)
                    .filter(([key]) => key !== "player_id")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-muted-foreground">{formatStatKey(key)}</span>
                        <span className="text-sm font-medium text-foreground">{String(value ?? "-")}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">No stats available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
