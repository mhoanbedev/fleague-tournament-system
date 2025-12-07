import { Team } from "../models/team.model";

export interface ScheduleMatch {
  round: number;
  matchNumber: number;
  homeTeam: string; 
  awayTeam: string; 
  group?: string | null;
}

export const generateRoundRobinSchedule = (
  teams: Team[]
): ScheduleMatch[] => {
  const n = teams.length;
  
  if (n < 2) {
    throw new Error("Cần ít nhất 2 đội để tạo lịch");
  }

  const schedule: ScheduleMatch[] = [];
  let teamsArray = [...teams];

  if (n % 2 !== 0) {
    teamsArray.push(null as any);
  }

  const totalTeams = teamsArray.length;
  const rounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  for (let round = 0; round < rounds; round++) {
    let matchNumber = 1;

    for (let i = 0; i < matchesPerRound; i++) {
      const home = teamsArray[i];
      const away = teamsArray[totalTeams - 1 - i];
      if (home && away) {
        schedule.push({
          round: round + 1,
          matchNumber: matchNumber++,
          homeTeam: home._id.toString(),
          awayTeam: away._id.toString(),
          group: home.group || null,
        });
      }
    }
    teamsArray.splice(1, 0, teamsArray.pop()!);
  }

  return schedule;
};


export const generateGroupStageSchedule = (
  teams: Team[],
  numberOfGroups: number
): ScheduleMatch[] => {
  const schedule: ScheduleMatch[] = [];
  const groupedTeams: { [key: string]: Team[] } = {};

  teams.forEach((team) => {
    if (team.group) {
      if (!groupedTeams[team.group]) {
        groupedTeams[team.group] = [];
      }
      groupedTeams[team.group].push(team);
    }
  });

  for (const groupName in groupedTeams) {
    const groupTeams = groupedTeams[groupName];
    const groupSchedule = generateRoundRobinSchedule(groupTeams);
    schedule.push(...groupSchedule);
  }

  return schedule;
};

export const validateScheduleGeneration = (
  leagueType: string,
  teams: Team[],
  numberOfTeams: number
): string | null => {
  if (teams.length !== numberOfTeams) {
    return `Cần đủ ${numberOfTeams} đội để tạo lịch (hiện có ${teams.length} đội)`;
  }

  if (leagueType === "group-stage") {
    const teamsWithoutGroup = teams.filter((team) => !team.group);
    if (teamsWithoutGroup.length > 0) {
      return "Tất cả các đội phải được phân bảng trước khi tạo lịch";
    }
  }

  return null; 
};