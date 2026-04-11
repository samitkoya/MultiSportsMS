const BASE_URL = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export interface DashboardSummary {
  total_players: number;
  total_teams: number;
  upcoming_matches: number;
  completed_matches: number;
  matches_completed: number;
}

export interface TopPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  team_name: string;
  sport_name: string;
  matches_played: number;
  avg_rating: number;
}

export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  team_id: number | null;
  jersey_number: number | null;
  position: string | null;
  status: string;
  joined_date?: string | null;
  team_name: string | null;
  sport_id?: number | null;
  sport_name?: string | null;
}

export interface PlayerStats {
  player_id: number;
  player_name: string;
  matches_played: number;
  total_runs: number;
  total_balls: number;
  total_wickets: number;
  total_goals: number;
  total_assists: number;
  total_yellows: number;
  total_reds: number;
  total_points: number;
  total_sets: number;
  avg_rating: number | null;
}

export interface Team {
  team_id: number;
  name: string;
  sport_id: number;
  coach_id: number | null;
  founded_year: number | null;
  home_venue_id: number | null;
  team_image_url: string | null;
  status: string;
  sport_name: string;
  coach_name: string;
  home_venue: string;
  venue_name: string;
  player_count?: number;
}

export interface MatchTeam {
  team_id: number;
  team_name: string;
  score: number | null;
  is_winner: number | null;
  innings_1_score: number | null;
  innings_2_score: number | null;
  sets_won: number | null;
}

export interface Match {
  match_id: number;
  event_id: number | null;
  venue_id: number | null;
  match_date: string;
  status: string;
  round_name: string | null;
  result_summary: string | null;
  event_name: string | null;
  sport_id: number | null;
  sport_name: string | null;
  venue_name: string | null;
  teams: MatchTeam[];
}

export interface Event {
  event_id: number;
  name: string;
  sport_id: number;
  event_type: string;
  format: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  description: string | null;
  sport_name: string;
  team_count?: number;
}

export interface Coach {
  coach_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  experience_years: number;
  team_count?: number;
  team_names?: string | null;
}

export interface Venue {
  venue_id: number;
  name: string;
  location: string;
  capacity: number | null;
  surface_type: string | null;
  home_team_count?: number;
  scheduled_match_count?: number;
}

// Dashboard
export const getDashboardOverview = () =>
  fetchJSON<DashboardSummary>("/dashboard/summary");

export const getTopPlayers = (limit = 5) =>
  fetchJSON<{ players: TopPlayer[] }>(`/dashboard/top-players?limit=${limit}`);

// Players
export const getPlayers = () =>
  fetchJSON<Player[]>("/players");

export const createPlayer = (data: Record<string, unknown>) =>
  fetchJSON("/players", { method: "POST", body: JSON.stringify(data) });

export const updatePlayer = (id: number, data: Record<string, unknown>) =>
  fetchJSON(`/players/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getPlayerStats = (id: number) =>
  fetchJSON<PlayerStats>(`/players/${id}/stats`);

export const deletePlayer = (id: number) =>
  fetchJSON(`/players/${id}`, { method: "DELETE" });

// Teams
export const getTeams = () =>
  fetchJSON<Team[]>("/teams");

export const getTeam = (id: number) =>
  fetchJSON<Record<string, unknown>>(`/teams/${id}`);

export const createTeam = (data: Record<string, unknown>) =>
  fetchJSON("/teams", { method: "POST", body: JSON.stringify(data) });

export const updateTeam = (id: number, data: Record<string, unknown>) =>
  fetchJSON(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteTeam = (id: number) =>
  fetchJSON(`/teams/${id}`, { method: "DELETE" });

export const addPlayerToTeam = (teamId: number, playerId: number) =>
  fetchJSON(`/teams/${teamId}/players`, { method: "POST", body: JSON.stringify({ player_id: playerId }) });

// Matches
export const getMatches = () =>
  fetchJSON<Match[]>("/matches");

export const scheduleMatch = (data: Record<string, unknown>) =>
  fetchJSON("/matches", { method: "POST", body: JSON.stringify(data) });

export const logMatchScore = (id: number, teamId: number, data: { score?: number; innings_1_score?: number; innings_2_score?: number; sets_won?: number }) =>
  fetchJSON(`/matches/${id}/score`, { method: "PUT", body: JSON.stringify({ team_id: teamId, ...data }) });

export const logMatchResult = (id: number, data: { team1_id: number; team1_score: number; team2_id: number; team2_score: number; winner_team_id: number; result_summary: string }) =>
  fetchJSON(`/matches/${id}/result`, { method: "PUT", body: JSON.stringify(data) });

export const updateMatchStatus = (id: number, data: Record<string, unknown>) =>
  fetchJSON(`/matches/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteMatch = (id: number) =>
  fetchJSON(`/matches/${id}`, { method: "DELETE" });

// Sports
export const getSports = () =>
  fetchJSON<Array<{ sport_id: number; name: string; category: string; rules_json: unknown; min_players_per_team: number; max_players_per_team: number; description: string; scoring_unit: string }>>("/sports");

// Events
export const getEvents = () =>
  fetchJSON<Event[]>("/events");

export const createEvent = (data: Record<string, unknown>) =>
  fetchJSON("/events", { method: "POST", body: JSON.stringify(data) });

export const updateEvent = (id: number, data: Record<string, unknown>) =>
  fetchJSON(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteEvent = (id: number) =>
  fetchJSON(`/events/${id}`, { method: "DELETE" });

export const registerTeamToEvent = (eventId: number, teamId: number) =>
  fetchJSON(`/events/${eventId}/teams`, { method: "POST", body: JSON.stringify({ team_id: teamId }) });

// Coaches
export const getCoaches = () =>
  fetchJSON<Coach[]>("/coaches");

export const createCoach = (data: Record<string, unknown>) =>
  fetchJSON("/coaches", { method: "POST", body: JSON.stringify(data) });

export const updateCoach = (id: number, data: Record<string, unknown>) =>
  fetchJSON(`/coaches/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteCoach = (id: number) =>
  fetchJSON(`/coaches/${id}`, { method: "DELETE" });

// Venues
export const getVenues = () =>
  fetchJSON<Venue[]>("/venues");

export const createVenue = (data: Record<string, unknown>) =>
  fetchJSON("/venues", { method: "POST", body: JSON.stringify(data) });

export const updateVenue = (id: number, data: Record<string, unknown>) =>
  fetchJSON(`/venues/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteVenue = (id: number) =>
  fetchJSON(`/venues/${id}`, { method: "DELETE" });
