import Team from "../models/team.model";

export const resetTeamStats = async (teamId: string): Promise<void> => {
  await Team.updateOne(
    { _id: teamId },
    {
      $set: {
        "stats.played": 0,
        "stats.won": 0,
        "stats.drawn": 0,
        "stats.lost": 0,
        "stats.goalsFor": 0,
        "stats.goalsAgainst": 0,
        "stats.goalDifference": 0,
        "stats.points": 0,
        form: [],
      },
    }
  );
};


export const resetAllTeamsStats = async (leagueId: string): Promise<void> => {
  await Team.updateMany(
    { league: leagueId },
    {
      $set: {
        "stats.played": 0,
        "stats.won": 0,
        "stats.drawn": 0,
        "stats.lost": 0,
        "stats.goalsFor": 0,
        "stats.goalsAgainst": 0,
        "stats.goalDifference": 0,
        "stats.points": 0,
        form: [],
      },
    }
  );
};