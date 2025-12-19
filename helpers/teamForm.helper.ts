import  Match  from "../models/match.model";

export type TeamForm = "W" | "D" | "L";

export const rebuildTeamForm = async (
  teamId: string,
  leagueId: string
): Promise<TeamForm[]> => {
  const matches = await Match.find({
    league: leagueId,
    status: "finished",
    $or: [{ homeTeam: teamId }, { awayTeam: teamId }],
  })
    .sort({ playedDate: -1 })
    .limit(5);

  return matches.map(match => {
    const isHome = match.homeTeam.toString() === teamId;

    const goalsFor = isHome
      ? match.score.home
      : match.score.away;

    const goalsAgainst = isHome
      ? match.score.away
      : match.score.home;

    if (goalsFor > goalsAgainst) return "W";
    if (goalsFor < goalsAgainst) return "L";
    return "D";
  });
};
