import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, BarChart3, Pencil } from "lucide-react";
import { type Player, getPlayers, getTeams, createPlayer, updatePlayer, deletePlayer, getPlayerStats } from "@/lib/api";
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

export default function PlayersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState("");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", team_id: "", jersey_number: "", position: "", date_of_birth: "" });

  const { data: players, isLoading } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: getTeams });
  const { data: playerStats, isLoading: loadingStats } = useQuery({
    queryKey: ["player-stats", selectedPlayerId],
    queryFn: () => getPlayerStats(selectedPlayerId!),
    enabled: !!selectedPlayerId,
  });

  const createMut = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players"] }); setCreateOpen(false); toast.success("Player created"); },
    onError: () => toast.error("Failed to create player"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updatePlayer(data.id, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players"] }); setCreateOpen(false); toast.success("Player updated"); },
    onError: () => toast.error("Failed to update player"),
  });
  const deleteMut = useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players"] }); toast.success("Player deleted"); },
    onError: () => toast.error("Failed to delete player"),
  });

  const filtered = players?.filter((p) => {
    const q = search.toLowerCase();
    return `${p.first_name} ${p.last_name} ${p.email} ${p.team_name} ${p.position}`.toLowerCase().includes(q);
  });

  const statusColor = (s: string) => {
    if (s === "active") return "bg-sport-green/20 text-sport-green border-sport-green/30";
    if (s === "injured") return "bg-sport-red/20 text-sport-red border-sport-red/30";
    return "bg-muted text-muted-foreground";
  };

  const handleSave = () => {
    const data = {
      ...form,
      team_id: form.team_id ? Number(form.team_id) : undefined,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : undefined,
    };
    if (isEdit && selectedPlayerId) {
      updateMut.mutate({ id: selectedPlayerId, body: data });
    } else {
      createMut.mutate(data);
    }
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedPlayerId(null);
    setForm({ first_name: "", last_name: "", email: "", team_id: "", jersey_number: "", position: "", date_of_birth: "" });
    setCreateOpen(true);
  };

  const openEdit = (p: Player) => {
    setIsEdit(true);
    setSelectedPlayerId(p.player_id);
    setForm({
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      email: p.email || "",
      team_id: p.team_id ? String(p.team_id) : "",
      jersey_number: p.jersey_number ? String(p.jersey_number) : "",
      position: p.position || "",
      date_of_birth: p.date_of_birth ? new Date(p.date_of_birth).toISOString().split('T')[0] : ""
    });
    setCreateOpen(true);
  };

  const formatStatKey = (key: string) =>
    key.replace(/^total_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppLayout>
      <PageHeader title="Players" description="Manage all players across sports">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Player
        </Button>
      </PageHeader>

      {/* Search */}
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

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Position</TableHead>
              <TableHead className="text-muted-foreground text-center">Jersey</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((p) => (
                <TableRow key={p.player_id} className="border-border">
                  <TableCell className="font-medium text-foreground">{p.first_name} {p.last_name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.team_name || "Unassigned"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.position || "—"}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{p.jersey_number ?? "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedPlayerId(p.player_id); setSelectedPlayerName(`${p.first_name} ${p.last_name}`); setStatsOpen(true); }}
                      >
                        <BarChart3 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(p.player_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No players found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Player Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Player" : "Add New Player"}</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
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
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((t) => (
                    <SelectItem key={t.team_id} value={String(t.team_id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jersey #</Label>
                <Input type="number" value={form.jersey_number} onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="bg-secondary border-border" />
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

      {/* Player Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={(open) => { setStatsOpen(open); if (!open) setSelectedPlayerId(null); }}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Stats — {selectedPlayerName}</DialogTitle>
            <DialogDescription>Performance statistics across matches.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingStats ? (
              <p className="text-muted-foreground text-center py-4">Loading stats...</p>
            ) : playerStats ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary p-4">
                  {Object.entries(playerStats)
                    .filter(([k]) => !["player_id"].includes(k))
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-muted-foreground">{formatStatKey(key)}</span>
                        <span className="text-sm font-medium text-foreground">{String(val ?? "-")}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No stats available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
