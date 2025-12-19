import  Match  from "../models/match.model";
import  Team  from "../models/team.model";
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


export const rollbackTeamStats = async (
  teamId: string,
  goalsFor: number,
  goalsAgainst: number,
  result: "win" | "draw" | "loss"
): Promise<void> => {
  const update: any = {
    $inc: {
      "stats.played": -1,
      "stats.goalsFor": -goalsFor,
      "stats.goalsAgainst": -goalsAgainst,
      "stats.goalDifference": -(goalsFor - goalsAgainst),
    },
  };

  if (result === "win") {
    update.$inc["stats.won"] = -1;
    update.$inc["stats.points"] = -3;
  } else if (result === "draw") {
    update.$inc["stats.drawn"] = -1;
    update.$inc["stats.points"] = -1;
  } else {
    update.$inc["stats.lost"] = -1;
  }

  await Team.updateOne({ _id: teamId }, update);
};
