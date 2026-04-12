import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, ClipboardCheck, Activity, ArrowUp, ArrowDown } from "lucide-react";
import { getMatches, logMatchResult, logMatchScore, scheduleMatch, updateMatchStatus, deleteMatch, getEvents, getEvent, getSports, getTeams, getPlayers, getMatchDetails, savePlayerMatchStats, type Match } from "@/lib/api";
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

interface MatchExtended extends Match {
  team1_id?: number;
  team1_name?: string;
  team1_score?: number | string;
  team1_wickets?: number | string;
  team2_id?: number;
  team2_name?: string;
  team2_score?: number | string;
  team2_wickets?: number | string;
}

export default function MatchesPage() {
  const qc = useQueryClient();
  const { data: rawMatches, isLoading } = useQuery({ queryKey: ["matches"], queryFn: getMatches });
  
  const matches: MatchExtended[] | undefined = rawMatches?.map(m => {
    const t1 = m.teams?.[0];
    const t2 = m.teams?.[1];
    return {
      ...m,
      team1_id: t1?.team_id,
      team1_name: t1?.team_name,
      team1_score: t1?.score ?? t1?.sets_won ?? t1?.innings_1_score ?? "",
      team1_wickets: t1?.wickets ?? "",
      team2_id: t2?.team_id,
      team2_name: t2?.team_name,
      team2_score: t2?.score ?? t2?.sets_won ?? t2?.innings_1_score ?? "",
      team2_wickets: t2?.wickets ?? "",
    };
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const { data: events } = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: getTeams });
  const { data: sports } = useQuery({ queryKey: ["sports"], queryFn: getSports });

  const [resultOpen, setResultOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchExtended | null>(null);
  const [scores, setScores] = useState({ team1_score: "", team2_score: "", team1_wickets: "", team2_wickets: "", team1_sets: "", team2_sets: "" });
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [statsForm, setStatsForm] = useState<any>({ player_id: "" });

  const { data: players } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: currentMatchDetails, isLoading: loadingMatchDetails } = useQuery({
    queryKey: ["match", selectedMatch?.match_id],
    queryFn: () => getMatchDetails(selectedMatch!.match_id),
    enabled: !!selectedMatch?.match_id && (statsOpen || resultOpen),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ event_id: "standalone", sport_id: "", match_date: "", team1_id: "", team2_id: "", status: "scheduled", round_name: "" });

  const { data: eventData } = useQuery({
    queryKey: ["event", form.event_id],
    queryFn: () => getEvent(Number(form.event_id)),
    enabled: form.event_id !== "standalone" && !!form.event_id,
  });

  const createMut = useMutation({
    mutationFn: scheduleMatch,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["matches"] }); 
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      setCreateOpen(false); 
      toast.success("Match scheduled"); 
    },
    onError: (err: any) => toast.error(err.message || "Failed to schedule match"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: any }) => updateMatchStatus(data.id, data.body),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["matches"] }); 
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      setCreateOpen(false); 
      toast.success("Match updated"); 
    },
    onError: (err: any) => toast.error(err.message || "Failed to update match"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["matches"] }); 
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      toast.success("Match deleted"); 
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete match"),
  });

  const logMut = useMutation({
    mutationFn: async (m: MatchExtended) => {
      const sport = (m.sport_name || "").toLowerCase();
      const isCricket = sport.includes("cricket");
      const isFootball = sport.includes("football") || sport.includes("soccer");
      const isTennisBad = sport.includes("tennis") || sport.includes("badminton");

      const s1 = Number(scores.team1_score);
      const s2 = Number(scores.team2_score);
      const w1 = Number(scores.team1_wickets) || 0;
      const w2 = Number(scores.team2_wickets) || 0;
      const sets1 = Number(scores.team1_sets) || 0;
      const sets2 = Number(scores.team2_sets) || 0;

      const winner = s1 > s2 ? m.team1_id : s2 > s1 ? m.team2_id : m.team1_id;

      let scoreObj1: { score: number; innings_1_score?: number; wickets?: number; sets_won?: number } = { score: s1 };
      let scoreObj2: { score: number; innings_1_score?: number; wickets?: number; sets_won?: number } = { score: s2 };
      let summary = `${m.team1_name} ${s1} - ${s2} ${m.team2_name}`;

      if (isCricket) {
        scoreObj1 = { score: s1, innings_1_score: s1, wickets: w1 };
        scoreObj2 = { score: s2, innings_1_score: s2, wickets: w2 };
        summary = `${m.team1_name} ${s1}/${w1} - ${s2}/${w2} ${m.team2_name}`;
      } else if (isTennisBad) {
        scoreObj1 = { score: s1, sets_won: sets1 };
        scoreObj2 = { score: s2, sets_won: sets2 };
        summary = `${m.team1_name} ${sets1} sets (${s1} pts) - ${sets2} sets (${s2} pts) ${m.team2_name}`;
      }

      if (m.match_id && m.team1_id && m.team2_id) {
        await logMatchScore(m.match_id, m.team1_id, scoreObj1);
        await logMatchScore(m.match_id, m.team2_id, scoreObj2);

        return logMatchResult(m.match_id, {
          team1_id: m.team1_id,
          team1_score: s1,
          team2_id: m.team2_id,
          team2_score: s2,
          winner_team_id: winner || m.team1_id,
          result_summary: summary,
        });
      }
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["matches"] }); 
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      setResultOpen(false); 
      toast.success("Result logged"); 
    },
    onError: () => toast.error("Failed to log result"),
  });

  const statsMut = useMutation({
    mutationFn: (data: { matchId: number, body: any }) => savePlayerMatchStats(data.matchId, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match", selectedMatch?.match_id] });
      qc.invalidateQueries({ queryKey: ["top-players"] });
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      setStatsForm({ player_id: "" });
      toast.success("Player stats logged");
    },
    onError: (err: any) => toast.error(err.message || "Failed to log player stats"),
  });

  const handleSaveMatch = () => {
    const b = {
      event_id: form.event_id !== "standalone" ? Number(form.event_id) : undefined,
      sport_id: form.event_id === "standalone" && form.sport_id ? Number(form.sport_id) : undefined,
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
    setForm({ event_id: "standalone", sport_id: "", match_date: "", team1_id: "", team2_id: "", status: "scheduled", round_name: "" });
    setCreateOpen(true);
  };

  const openEdit = (m: MatchExtended) => {
    setIsEdit(true);
    setSelectedMatch(m);
    setForm({
      event_id: m.event_id ? String(m.event_id) : "standalone",
      sport_id: m.sport_id ? String(m.sport_id) : "",
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

  const openResult = (m: MatchExtended) => {
    setSelectedMatch(m);
    setScores({
      team1_score: String(m.team1_score ?? ""),
      team2_score: String(m.team2_score ?? ""),
      team1_wickets: String(m.team1_wickets ?? ""),
      team2_wickets: String(m.team2_wickets ?? ""),
      team1_sets: "",
      team2_sets: "",
    });
    setResultOpen(true);
  };

  const openStats = (m: MatchExtended) => {
    setSelectedMatch(m);
    setSelectedTeamId(String(m.team1_id));
    setStatsForm({ player_id: "" });
    setStatsOpen(true);
  };

  const handleSaveStats = () => {
    if (!selectedMatch || !statsForm.player_id) return;
    statsMut.mutate({ matchId: selectedMatch.match_id, body: { ...statsForm, player_id: Number(statsForm.player_id) } });
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

  const sortedMatches = [...(matches || [])].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue: any = a[key as keyof MatchExtended];
    let bValue: any = b[key as keyof MatchExtended];

    if (key === 'match_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
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
      <PageHeader title="Matches" description="View and manage all matches">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Schedule Match
        </Button>
      </PageHeader>
      <div className="glass-card glass-card-glow-green overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('team1_name')}
              >
                <div className="flex items-center">Match <SortIcon column="team1_name" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('sport_name')}
              >
                <div className="flex items-center">Sport <SortIcon column="sport_name" /></div>
              </TableHead>
              <TableHead className="text-muted-foreground text-center">Score</TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('match_date')}
              >
                <div className="flex items-center">Date <SortIcon column="match_date" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">Status <SortIcon column="status" /></div>
              </TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : sortedMatches && sortedMatches.length > 0 ? (
              sortedMatches.map((m) => (
                <TableRow key={m.match_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <p>{m.team1_name} vs {m.team2_name}</p>
                    {m.event_name && <p className="text-xs text-muted-foreground font-normal">{m.event_name}</p>}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{m.sport_name}</Badge></TableCell>
                  <TableCell className="text-center font-mono text-foreground">
                    {m.status === "completed" ? (() => {
                      const sport = (m.sport_name || "").toLowerCase();
                      const t1 = m.teams?.[0];
                      const t2 = m.teams?.[1];
                      if (sport.includes("cricket")) {
                        return `${t1?.score ?? m.team1_score}/${t1?.wickets ?? 0} - ${t2?.score ?? m.team2_score}/${t2?.wickets ?? 0}`;
                      }
                      if (sport.includes("tennis") || sport.includes("badminton")) {
                        return `${t1?.sets_won ?? m.team1_score} - ${t2?.sets_won ?? m.team2_score} sets`;
                      }
                      return `${m.team1_score} - ${m.team2_score}`;
                    })() : "—"}
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
                      <Button variant="ghost" size="icon" title="Log Player Stats" onClick={() => openStats(m)}>
                        <Activity size={16} className="text-sport-blue" />
                      </Button>
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
              {selectedMatch?.sport_name && <Badge variant="secondary" className="ml-2">{selectedMatch.sport_name}</Badge>}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (() => {
            const sport = (selectedMatch.sport_name || "").toLowerCase();
            const isCricket = sport.includes("cricket");
            const isFootball = sport.includes("football") || sport.includes("soccer");
            const isTennisBad = sport.includes("tennis") || sport.includes("badminton");
            return (
              <div className="grid gap-4 py-4">
                {/* --- Cricket: Runs + Wickets --- */}
                {isCricket && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{selectedMatch.team1_name} Runs</Label>
                        <Input type="number" min={0} value={scores.team1_score} onChange={(e) => setScores({ ...scores, team1_score: e.target.value })} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>{selectedMatch.team2_name} Runs</Label>
                        <Input type="number" min={0} value={scores.team2_score} onChange={(e) => setScores({ ...scores, team2_score: e.target.value })} className="bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{selectedMatch.team1_name} Wickets</Label>
                        <Input type="number" min={0} max={10} value={scores.team1_wickets} onChange={(e) => setScores({ ...scores, team1_wickets: e.target.value })} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>{selectedMatch.team2_name} Wickets</Label>
                        <Input type="number" min={0} max={10} value={scores.team2_wickets} onChange={(e) => setScores({ ...scores, team2_wickets: e.target.value })} className="bg-secondary border-border" />
                      </div>
                    </div>
                  </>
                )}

                {/* --- Football: Goals --- */}
                {isFootball && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{selectedMatch.team1_name} Goals</Label>
                      <Input type="number" min={0} value={scores.team1_score} onChange={(e) => setScores({ ...scores, team1_score: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>{selectedMatch.team2_name} Goals</Label>
                      <Input type="number" min={0} value={scores.team2_score} onChange={(e) => setScores({ ...scores, team2_score: e.target.value })} className="bg-secondary border-border" />
                    </div>
                  </div>
                )}

                {/* --- Tennis / Badminton: Points + Sets --- */}
                {isTennisBad && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{selectedMatch.team1_name} Points</Label>
                        <Input type="number" min={0} value={scores.team1_score} onChange={(e) => setScores({ ...scores, team1_score: e.target.value })} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>{selectedMatch.team2_name} Points</Label>
                        <Input type="number" min={0} value={scores.team2_score} onChange={(e) => setScores({ ...scores, team2_score: e.target.value })} className="bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{selectedMatch.team1_name} Sets Won</Label>
                        <Input type="number" min={0} value={scores.team1_sets} onChange={(e) => setScores({ ...scores, team1_sets: e.target.value })} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>{selectedMatch.team2_name} Sets Won</Label>
                        <Input type="number" min={0} value={scores.team2_sets} onChange={(e) => setScores({ ...scores, team2_sets: e.target.value })} className="bg-secondary border-border" />
                      </div>
                    </div>
                  </>
                )}

                {/* --- Fallback: Generic Score --- */}
                {!isCricket && !isFootball && !isTennisBad && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{selectedMatch.team1_name} Score</Label>
                      <Input type="number" min={0} value={scores.team1_score} onChange={(e) => setScores({ ...scores, team1_score: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>{selectedMatch.team2_name} Score</Label>
                      <Input type="number" min={0} value={scores.team2_score} onChange={(e) => setScores({ ...scores, team2_score: e.target.value })} className="bg-secondary border-border" />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedMatch && logMut.mutate(selectedMatch)} disabled={logMut.isPending || scores.team1_score === "" || scores.team2_score === ""}>
              Submit Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Player Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="glass-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Player Statistics</DialogTitle>
            <DialogDescription>
              {selectedMatch ? `${selectedMatch.team1_name} vs ${selectedMatch.team2_name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={selectedTeamId} onValueChange={(v) => { setSelectedTeamId(v); setStatsForm({ player_id: "" }); }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(selectedMatch?.team1_id)}>{selectedMatch?.team1_name}</SelectItem>
                    <SelectItem value={String(selectedMatch?.team2_id)}>{selectedMatch?.team2_name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={statsForm.player_id} onValueChange={(v) => setStatsForm({ player_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players?.filter(p => String(p.team_id) === selectedTeamId).map((p) => (
                      <SelectItem key={p.player_id} value={String(p.player_id)}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {statsForm.player_id && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                {selectedMatch?.sport_name?.toLowerCase().includes("cricket") && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Runs</Label>
                      <Input type="number" min={0} value={statsForm.runs_scored || ""} onChange={(e) => setStatsForm({ ...statsForm, runs_scored: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Balls</Label>
                      <Input type="number" min={0} value={statsForm.balls_faced || ""} onChange={(e) => setStatsForm({ ...statsForm, balls_faced: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Wickets</Label>
                      <Input type="number" min={0} value={statsForm.wickets_taken || ""} onChange={(e) => setStatsForm({ ...statsForm, wickets_taken: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Overs</Label>
                      <Input type="number" min={0} step="0.1" value={statsForm.overs_bowled || ""} onChange={(e) => setStatsForm({ ...statsForm, overs_bowled: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Runs Conc.</Label>
                      <Input type="number" min={0} value={statsForm.runs_conceded || ""} onChange={(e) => setStatsForm({ ...statsForm, runs_conceded: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                  </>
                )}
                {(selectedMatch?.sport_name?.toLowerCase().includes("football") || selectedMatch?.sport_name?.toLowerCase().includes("soccer")) && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Goals</Label>
                      <Input type="number" min={0} value={statsForm.goals_scored || ""} onChange={(e) => setStatsForm({ ...statsForm, goals_scored: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Assists</Label>
                      <Input type="number" min={0} value={statsForm.assists || ""} onChange={(e) => setStatsForm({ ...statsForm, assists: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Yellow</Label>
                      <Input type="number" min={0} value={statsForm.yellow_cards || ""} onChange={(e) => setStatsForm({ ...statsForm, yellow_cards: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Red</Label>
                      <Input type="number" min={0} value={statsForm.red_cards || ""} onChange={(e) => setStatsForm({ ...statsForm, red_cards: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                  </>
                )}
                {(selectedMatch?.sport_name?.toLowerCase().includes("tennis") || selectedMatch?.sport_name?.toLowerCase().includes("badminton")) && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Points</Label>
                      <Input type="number" min={0} value={statsForm.points_won || ""} onChange={(e) => setStatsForm({ ...statsForm, points_won: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Sets</Label>
                      <Input type="number" min={0} value={statsForm.sets_won || ""} onChange={(e) => setStatsForm({ ...statsForm, sets_won: e.target.value })} className="bg-secondary/50 h-8 text-sm" />
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-2">
               <Button variant="secondary" size="sm" onClick={() => setStatsForm({ player_id: statsForm.player_id })}>Clear</Button>
               <Button size="sm" onClick={handleSaveStats} disabled={!statsForm.player_id || statsMut.isPending}>Save Stat</Button>
            </div>

            {loadingMatchDetails ? (
              <div className="text-xs text-muted-foreground mt-4">Loading logged stats...</div>
            ) : currentMatchDetails?.player_stats && currentMatchDetails.player_stats.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <Label className="mb-2 block">Previously Logged</Label>
                <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
                  <Table className="text-xs">
                    <TableBody>
                      {currentMatchDetails.player_stats.map((s: any) => (
                        <TableRow key={s.record_id} className="border-border">
                          <TableCell className="font-medium">{s.player_name}</TableCell>
                          <TableCell className="text-muted-foreground">{s.team_name}</TableCell>
                          <TableCell className="text-right">
                             {s.runs_scored > 0 ? `Runs: ${s.runs_scored} ` : ""}
                             {s.wickets_taken > 0 ? `Wkt: ${s.wickets_taken} ` : ""}
                             {s.goals_scored > 0 ? `Gls: ${s.goals_scored} ` : ""}
                             {s.points_won > 0 ? `Pts: ${s.points_won} ` : ""}
                             {s.sets_won > 0 ? `Sets: ${s.sets_won} ` : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsOpen(false)}>Close</Button>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event / Tournament</Label>
                <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v, team1_id: "", team2_id: "" })}>
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

              {form.event_id === "standalone" && (
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Select value={form.sport_id} onValueChange={(v) => setForm({ ...form, sport_id: v, team1_id: "", team2_id: "" })}>
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
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team 1</Label>
                <Select value={form.team1_id} onValueChange={(v) => setForm({ ...form, team1_id: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.filter(t => String(t.team_id) !== form.team2_id)
                      .filter(t => form.event_id !== "standalone" ? eventData?.teams?.some(et => et.team_id === t.team_id) : (form.sport_id ? t.sport_id === Number(form.sport_id) : true))
                      .map((t) => (
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
                    {teams?.filter(t => String(t.team_id) !== form.team1_id)
                      .filter(t => form.event_id !== "standalone" ? eventData?.teams?.some(et => et.team_id === t.team_id) : (form.sport_id ? t.sport_id === Number(form.sport_id) : true))
                      .map((t) => (
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
