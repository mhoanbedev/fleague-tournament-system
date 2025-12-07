import { Team } from "../models/team.model";
import { League } from "../models/league.model";

export const assignTeamsToGroups = (
  teams: Team[],
  numberOfGroups: number
): { [key: string]: Team[] } => {
  const groups: { [key: string]: Team[] } = {};
  const groupNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .slice(0, numberOfGroups);
  groupNames.forEach((name) => {
    groups[name] = [];
  });
  teams.forEach((team, index) => {
    const groupIndex = index % numberOfGroups;
    groups[groupNames[groupIndex]].push(team);
  });

  return groups;
};

export const canAssignGroups = (league: League, teams: Team[]): string | null => {
  if (league.type !== "group-stage") {
    return "Chỉ có thể phân bảng cho giải đấu loại group-stage";
  }

  if (!league.groupSettings) {
    return "Giải đấu chưa có cấu hình phân bảng";
  }

  const { numberOfGroups, teamsPerGroup } = league.groupSettings;
  const requiredTeams = numberOfGroups * teamsPerGroup;

  if (teams.length !== requiredTeams) {
    return `Cần đủ ${requiredTeams} đội để phân bảng (hiện có ${teams.length} đội)`;
  }

  const teamsWithGroup = teams.filter((team) => team.group);
  if (teamsWithGroup.length > 0) {
    return "Có đội đã được phân bảng rồi. Vui lòng reset trước khi phân bảng lại.";
  }

  return null; 
};


export const resetAllGroups = async (leagueId: string): Promise<void> => {
  const Team = require("../models/team.model").default;
  await Team.updateMany({ league: leagueId }, { group: null });
};