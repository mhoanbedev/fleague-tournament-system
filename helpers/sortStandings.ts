import { Team } from "../models/team.model";

export const sortTeamsByStandings = (teams: Team[]): Team[] => {
  return teams.sort((a, b) => {
    if (b.stats.points !== a.stats.points) {
      return b.stats.points - a.stats.points;
    }

    if (b.stats.goalDifference !== a.stats.goalDifference) {
      return b.stats.goalDifference - a.stats.goalDifference;
    }

    if (b.stats.goalsFor !== a.stats.goalsFor) {
      return b.stats.goalsFor - a.stats.goalsFor;
    }

    return a.name.localeCompare(b.name);
  });
};

export interface StandingRow {
  position: number;
  team: {
    _id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
  form: string[];
}

export const formatStandings = (teams: Team[]): StandingRow[] => {
  const sortedTeams = sortTeamsByStandings(teams);

  return sortedTeams.map((team, index) => ({
    position: index + 1,
    team: {
      _id: team._id.toString(),
      name: team.name,
      shortName: team.shortName,
      logo: team.logo,
    },
    stats: {
      played: team.stats.played,
      won: team.stats.won,
      drawn: team.stats.drawn,
      lost: team.stats.lost,
      goalsFor: team.stats.goalsFor,
      goalsAgainst: team.stats.goalsAgainst,
      goalDifference: team.stats.goalDifference,
      points: team.stats.points,
    },
    form: team.form,
  }));
};


export const getTopScorers = (teams: Team[], limit: number = 5): StandingRow[] => {
  const sortedByGoals = [...teams].sort((a, b) => {
    if (b.stats.goalsFor !== a.stats.goalsFor) {
      return b.stats.goalsFor - a.stats.goalsFor;
    }
    return b.stats.goalDifference - a.stats.goalDifference;
  });

  return formatStandings(sortedByGoals).slice(0, limit);
};

export const getBestDefense = (teams: Team[], limit: number = 5): StandingRow[] => {
  const sortedByDefense = [...teams].sort((a, b) => {
    if (a.stats.goalsAgainst !== b.stats.goalsAgainst) {
      return a.stats.goalsAgainst - b.stats.goalsAgainst;
    }
    return b.stats.points - a.stats.points;
  });

  return formatStandings(sortedByDefense).slice(0, limit);
};


export const getBestForm = (teams: Team[], limit: number = 5): StandingRow[] => {
  const teamsWithFormPoints = teams
    .filter((team) => team.form.length > 0)
    .map((team) => {
      const formPoints = team.form.reduce((sum, result) => {
        if (result === "W") return sum + 3;
        if (result === "D") return sum + 1;
        return sum;
      }, 0);

      return { team, formPoints };
    })
    .sort((a, b) => b.formPoints - a.formPoints);

  return teamsWithFormPoints
    .slice(0, limit)
    .map((item, index) => ({
      position: index + 1,
      team: {
        _id: item.team._id.toString(),
        name: item.team.name,
        shortName: item.team.shortName,
        logo: item.team.logo,
      },
      stats: item.team.stats,
      form: item.team.form,
    }));
}; 