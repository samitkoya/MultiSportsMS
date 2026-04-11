import { useQuery } from "@tanstack/react-query";
import { Users, Shield, Swords, Calendar, Star } from "lucide-react";
import { getDashboardOverview, getTopPlayers } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
  });

  const { data: topPlayers, isLoading: loadingPlayers } = useQuery({
    queryKey: ["top-players"],
    queryFn: () => getTopPlayers(5),
  });

  return (
    <AppLayout>
      <PageHeader title="Dashboard" description="Overview of your sports management system" />

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Players"
          value={loadingOverview ? "..." : overview?.total_players ?? 0}
          icon={Users}
          glowClass="glass-card-glow-blue"
        />
        <StatCard
          title="Total Teams"
          value={loadingOverview ? "..." : overview?.total_teams ?? 0}
          icon={Shield}
          glowClass="glass-card-glow-red"
        />
        <StatCard
          title="Matches Completed"
          value={loadingOverview ? "..." : overview?.completed_matches ?? overview?.matches_completed ?? 0}
          icon={Swords}
          glowClass="glass-card-glow-green"
        />
        <StatCard
          title="Upcoming Matches"
          value={loadingOverview ? "..." : overview?.upcoming_matches ?? 0}
          icon={Calendar}
          glowClass="glass-card-glow-yellow"
        />
      </div>

      {/* Top Players Table */}
      <div className="glass-card glass-card-glow-blue overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-5">
          <Star size={18} className="text-sport-yellow" />
          <h2 className="text-lg font-semibold text-foreground">Top Rated Players</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Player</TableHead>
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Sport</TableHead>
              <TableHead className="text-muted-foreground text-center">Matches</TableHead>
              <TableHead className="text-muted-foreground text-right">Avg Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPlayers ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : topPlayers?.players && topPlayers.players.length > 0 ? (
              topPlayers.players.map((p) => (
                <TableRow key={p.player_id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {p.first_name} {p.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.team_name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sport_name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{p.matches_played}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-sport-yellow">
                      {Number(p.avg_rating).toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No player data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
