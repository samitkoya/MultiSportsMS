import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, ShieldPlus, ArrowUp, ArrowDown } from "lucide-react";
import { getEvents, getEvent, getSports, getTeams, createEvent, updateEvent, deleteEvent, registerTeamToEvent } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EventAvatar } from "@/components/EventAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function TournamentsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState("");

  const [form, setForm] = useState({ name: "", sport_id: "", format: "", start_date: "", end_date: "", status: "upcoming", description: "", event_image_url: "" });

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: events, isLoading } = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const { data: sports } = useQuery({ queryKey: ["sports"], queryFn: getSports });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: getTeams });

  const { data: currentEventDetails, isLoading: loadingEventDetails } = useQuery({
    queryKey: ["event", selectedEventId],
    queryFn: () => getEvent(selectedEventId as number),
    enabled: !!selectedEventId && assignOpen,
  });

  const createMut = useMutation({
    mutationFn: createEvent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setCreateOpen(false); toast.success("Tournament created"); },
    onError: () => toast.error("Failed to create tournament"),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Record<string, unknown> }) => updateEvent(data.id, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setCreateOpen(false); toast.success("Tournament updated"); },
    onError: () => toast.error("Failed to update tournament"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); toast.success("Tournament deleted"); },
    onError: () => toast.error("Failed to delete tournament"),
  });

  const assignMut = useMutation({
    mutationFn: (data: { eventId: number; teamId: number }) => registerTeamToEvent(data.eventId, data.teamId),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["event", selectedEventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      setAssignTeamId("");
      toast.success("Team registered successfully"); 
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register team")
    },
  });

  const eventStatus = (e: { start_date: string; end_date: string; status: string }) => {
    if (e.status) return e.status;
    const now = new Date();
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    if (now > end) return "completed";
    if (now >= start && now <= end) return "ongoing";
    return "upcoming";
  };

  const statusStyle = (s: string) => {
    if (s === "completed") return "bg-muted text-muted-foreground border-border";
    if (s === "ongoing") return "bg-sport-green/20 text-sport-green border-sport-green/30";
    return "bg-sport-blue/20 text-sport-blue border-sport-blue/30";
  };

  const handleSave = () => {
    const data = {
      ...form,
      sport_id: Number(form.sport_id),
    };
    if (isEdit && selectedEventId) {
      updateMut.mutate({ id: selectedEventId, body: data });
    } else {
      createMut.mutate(data);
    }
  };

  const openCreate = () => {
    setIsEdit(false);
    setSelectedEventId(null);
    setForm({ name: "", sport_id: "", format: "", start_date: "", end_date: "", status: "upcoming", description: "", event_image_url: "" });
    setCreateOpen(true);
  };

  const openEdit = (e: { event_id: number; name: string; sport_id: number; format: string | null; start_date: string; end_date: string | null; status: string; description: string | null; event_image_url: string | null }) => {
    setIsEdit(true);
    setSelectedEventId(e.event_id);
    setForm({
      name: e.name || "",
      sport_id: e.sport_id ? String(e.sport_id) : "",
      format: e.format || "",
      start_date: e.start_date ? new Date(e.start_date).toISOString().split('T')[0] : "",
      end_date: e.end_date ? new Date(e.end_date).toISOString().split('T')[0] : "",
      status: e.status || "upcoming",
      description: e.description || "",
      event_image_url: e.event_image_url || "",
    });
    setCreateOpen(true);
  };

  const openAssign = (eventId: number) => {
    setSelectedEventId(eventId);
    setAssignTeamId("");
    setAssignOpen(true);
  };

  const handleAssign = () => {
    if (selectedEventId && assignTeamId) {
      assignMut.mutate({ eventId: selectedEventId, teamId: Number(assignTeamId) });
    }
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

  const sortedEvents = [...(events || [])].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue: any = a[key as keyof typeof a];
    let bValue: any = b[key as keyof typeof b];

    if (key === 'start_date' || key === 'end_date') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
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
      <PageHeader title="Tournaments" description="Events and tournaments across all sports">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Create Tournament
        </Button>
      </PageHeader>
      <div className="glass-card glass-card-glow-yellow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">Tournament <SortIcon column="name" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('sport_name')}
              >
                <div className="flex items-center">Sport <SortIcon column="sport_name" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('format')}
              >
                <div className="flex items-center">Format <SortIcon column="format" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('start_date')}
              >
                <div className="flex items-center">Start <SortIcon column="start_date" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('end_date')}
              >
                <div className="flex items-center">End <SortIcon column="end_date" /></div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">Status <SortIcon column="status" /></div>
              </TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : sortedEvents && sortedEvents.length > 0 ? (
              sortedEvents.map((e) => {
                const status = eventStatus(e);
                return (
                  <TableRow key={e.event_id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EventAvatar src={e.event_image_url} alt={e.name} />
                        <div>
                          <div>{e.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{e.description || "No description"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{e.sport_name}</Badge></TableCell>
                    <TableCell className="text-muted-foreground capitalize">{e.format || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{e.start_date ? new Date(e.start_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{e.end_date ? new Date(e.end_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle(status)}`}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Register Team"
                          onClick={() => openAssign(e.event_id)}
                        >
                          <ShieldPlus size={16} className="text-sport-yellow" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(e)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(e.event_id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No tournaments found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? "Edit Tournament" : "Create Tournament"}</DialogTitle>
            <DialogDescription>Fill in tournament details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Event Image URL</Label>
                <Input value={form.event_image_url} onChange={(e) => setForm({ ...form, event_image_url: e.target.value })} className="bg-secondary border-border" />
              </div>            
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
                <Label>Format</Label>
                <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} className="bg-secondary border-border" placeholder="e.g. Knockout, Round-Robin" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle className="text-foreground">Register Team to Tournament</DialogTitle>
            <DialogDescription>Select a team to participate in this tournament.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground font-semibold">Registered Teams</Label>
              {loadingEventDetails ? (
                <div className="text-sm text-muted-foreground">Loading registered teams...</div>
              ) : currentEventDetails?.teams && currentEventDetails.teams.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentEventDetails.teams.map((t: any) => (
                    <div key={t.team_id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-border">
                      <span className="text-sm font-medium">{t.name}</span>
                      <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic bg-secondary/30 p-3 rounded-md border border-border/50 text-center">
                  No teams registered yet.
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <Label>Add a Team</Label>
              <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select team to register" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.filter((t) => {
                    const selectedEvent = events?.find((event) => event.event_id === selectedEventId);
                    if (selectedEvent && t.sport_id !== selectedEvent.sport_id) return false;
                    
                    // Filter out already registered teams
                    if (currentEventDetails?.teams?.some((rt: any) => rt.team_id === t.team_id)) {
                      return false;
                    }
                    
                    return true;
                  }).map((t) => (
                    <SelectItem key={t.team_id} value={String(t.team_id)}>{t.name} ({t.sport_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Close</Button>
            <Button onClick={handleAssign} disabled={assignMut.isPending || !assignTeamId}>
              Register Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
