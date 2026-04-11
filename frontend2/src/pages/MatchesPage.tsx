import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, ClipboardCheck } from "lucide-react";
import { getMatches, logMatchResult, logMatchScore, scheduleMatch, updateMatchStatus, deleteMatch, getEvents, getTeams, type Match } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const getScoreLabel = (sportName: string) => {
  if (!sportName) return "Score";
  const name = sportName.toLowerCase();
  if (name.includes("cricket")) return "Runs";
  if (name.includes("football") || name.includes("soccer")) return "Goals";
  if (name.includes("badminton") || name.includes("tennis") || name.includes("volleyball")) return "Sets Won";
  return "Points";
};

export default function MatchesPage() {
  const qc = useQueryClient();
  const { data: rawMatches, isLoading } = useQuery({ queryKey: ["matches"], queryFn: getMatches });
  
  const matches = rawMatches?.map(m => {
    const t1 = m.teams?.[0];
    const t2 = m.teams?.[1];
    return {
      ...m,
      team1_id: t1?.team_id,
      team1_name: t1?.team_name,
      team1_score: t1?.score ?? t1?.sets_won ?? t1?.innings_1_score,
      team2_id: t2?.team_id,
      team2_name: t2?.team_name,
      team2_score: t2?.score ?? t2?.sets_won ?? t2?.innings_1_score,
    };
  });
  const { data: events } = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: getTeams });

  const [resultOpen, setResultOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scores, setScores] = useState({ team1_score: "", team2_score: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ event_id: "standalone", match_date: "", team1_id: "", team2_id: "", status: "scheduled", round_name: "" });

  const createMut = useMutation({
    mutationFn: scheduleMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches"] }); setCreateOpen(false); toast.success("Match scheduled"); },
    onError: () => toast.error("Failed to schedule match"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: object }) => updateMatchStatus(data.id, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches"] }); setCreateOpen(false); toast.success("Match updated"); },
    onError: () => toast.error("Failed to update match"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches"] }); toast.success("Match deleted"); },
    onError: () => toast.error("Failed to delete match"),
  });

  const logMut = useMutation({
    mutationFn: async (m: Match) => {
      const s1 = Number(scores.team1_score);
      const s2 = Number(scores.team2_score);
      const winner = s1 > s2 ? m.team1_id : s2 > s1 ? m.team2_id : m.team1_id;
      
      let scoreObj1: { score: number; innings_1_score?: number; sets_won?: number } = { score: s1 };
      let scoreObj2: { score: number; innings_1_score?: number; sets_won?: number } = { score: s2 };
      
      if (m.sport_name && (m.sport_name.toLowerCase().includes('badminton') || m.sport_name.toLowerCase().includes('tennis'))) {
        scoreObj1 = { score: s1, sets_won: s1 };
        scoreObj2 = { score: s2, sets_won: s2 };
      } else if (m.sport_name && m.sport_name.toLowerCase().includes('cricket')) {
        scoreObj1 = { score: s1, innings_1_score: s1 };
        scoreObj2 = { score: s2, innings_1_score: s2 };
      }

      await logMatchScore(m.match_id, m.team1_id, scoreObj1);
      await logMatchScore(m.match_id, m.team2_id, scoreObj2);

      return logMatchResult(m.match_id, {
        team1_id: m.team1_id,
        team1_score: s1,
        team2_id: m.team2_id,
        team2_score: s2,
        winner_team_id: winner,
        result_summary: `${m.team1_name} ${s1} - ${s2} ${m.team2_name}`,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches"] }); setResultOpen(false); toast.success("Result logged"); },
    onError: () => toast.error("Failed to log result"),
  });

  const handleSaveMatch = () => {
    const b = {
      event_id: form.event_id !== "standalone" ? Number(form.event_id) : undefined,
      match_date: form.match_date,
      status: form.status,
      round_name: form.round_name,
      team_ids: [Number(form.team1_id), Number(form.team2_id)],
    };
    if (isEdit && selectedMatch) {
      updateMut.mutate({ id: selectedMatch.match_id, body: b });
    } else {
      createMut.mutate(b);
    }
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedMatch(null);
    setForm({ event_id: "standalone", match_date: "", team1_id: "", team2_id: "", status: "scheduled", round_name: "" });
    setCreateOpen(true);
  };

  const openEdit = (m: Match) => {
    setIsEdit(true);
    setSelectedMatch(m);
    setForm({
      event_id: m.event_id ? String(m.event_id) : "standalone",
      match_date: m.match_date ? new Date(m.match_date).toISOString().split('T')[0] : "",
      team1_id: m.team1_id ? String(m.team1_id) : "",
      team2_id: m.team2_id ? String(m.team2_id) : "",
      status: m.status || "scheduled",
      round_name: m.round_name || "",
    });
    setCreateOpen(true);
  };

  const statusBadge = (s: string) => {
    if (s === "completed") return "bg-sport-green/20 text-sport-green border-sport-green/30";
    if (s === "ongoing") return "bg-sport-red/20 text-sport-red border-sport-red/30 animate-pulse-glow";
    return "bg-sport-yellow/20 text-sport-yellow border-sport-yellow/30";
  };

  const openResult = (m: Match) => {
    setSelectedMatch(m);
    setScores({ team1_score: m.team1_score ?? "", team2_score: m.team2_score ?? "" });
    setResultOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Matches" description="View and manage all matches">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Schedule Match
        </Button>
      </PageHeader>
      <div className="glass-card glass-card-glow-green overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Match</TableHead>
              <TableHead className="text-muted-foreground">Sport</TableHead>
              <TableHead className="text-muted-foreground text-center">Score</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : matches && matches.length > 0 ? (
              matches.map((m) => (
                <TableRow key={m.match_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <p>{m.team1_name} vs {m.team2_name}</p>
                    {m.event_name && <p className="text-xs text-muted-foreground font-normal">{m.event_name}</p>}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{m.sport_name}</Badge></TableCell>
                  <TableCell className="text-center font-mono text-foreground">
                    {m.status === "completed" ? `${m.team1_score} - ${m.team2_score}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(m.match_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={() => openResult(m)}>
                        <ClipboardCheck size={14} /> {m.status === "completed" ? "Edit Result" : "Log Result"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(m.match_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No matches found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Match Result</DialogTitle>
            <DialogDescription>
              {selectedMatch ? `${selectedMatch.team1_name} vs ${selectedMatch.team2_name}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{selectedMatch.team1_name} {getScoreLabel(selectedMatch.sport_name)}</Label>
                  <Input type="number" min={0} value={scores.team1_score} onChange={(e) => setScores({ ...scores, team1_score: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>{selectedMatch.team2_name} {getScoreLabel(selectedMatch.sport_name)}</Label>
                  <Input type="number" min={0} value={scores.team2_score} onChange={(e) => setScores({ ...scores, team2_score: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedMatch && logMut.mutate(selectedMatch)} disabled={logMut.isPending || scores.team1_score === "" || scores.team2_score === ""}>
              Submit Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule / Edit Match Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Match" : "Schedule Match"}</DialogTitle>
            <DialogDescription>Select teams and provide match details.</DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Event / Tournament</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Standalone Match" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone Match</SelectItem>
                  {events?.map((e) => (
                    <SelectItem key={e.event_id} value={String(e.event_id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team 1</Label>
                <Select value={form.team1_id} onValueChange={(v) => setForm({ ...form, team1_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.filter(t => String(t.team_id) !== form.team2_id).map((t) => (
                      <SelectItem key={t.team_id} value={String(t.team_id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team 2</Label>
                <Select value={form.team2_id} onValueChange={(v) => setForm({ ...form, team2_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.filter(t => String(t.team_id) !== form.team1_id).map((t) => (
                      <SelectItem key={t.team_id} value={String(t.team_id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Match Date</Label>
                <Input type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMatch} disabled={createMut.isPending || updateMut.isPending || !form.team1_id || !form.team2_id || !form.match_date}>
              {isEdit ? "Save Changes" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
