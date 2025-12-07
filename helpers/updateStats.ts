import { Team } from "../models/team.model";
import { Match } from "../models/match.model";

export const updateTeamStats = (
  team: Team,
  goalsFor: number,
  goalsAgainst: number,
  result: "win" | "draw" | "lose"
): void => {
  team.stats.played += 1;
  team.stats.goalsFor += goalsFor;
  team.stats.goalsAgainst += goalsAgainst;
  team.stats.goalDifference = team.stats.goalsFor - team.stats.goalsAgainst;


  if (result === "win") {
    team.stats.won += 1;
    team.stats.points += 3;
    team.form.unshift("W");
  } else if (result === "draw") {
    team.stats.drawn += 1;
    team.stats.points += 1;
    team.form.unshift("D");
  } else if (result === "lose") {
    team.stats.lost += 1;
    team.form.unshift("L");
  }

  if (team.form.length > 5) {
    team.form = team.form.slice(0, 5);
  }
};

export const revertTeamStats = (
  team: Team,
  goalsFor: number,
  goalsAgainst: number,
  result: "win" | "draw" | "lose"
): void => {
  team.stats.played -= 1;
  team.stats.goalsFor -= goalsFor;
  team.stats.goalsAgainst -= goalsAgainst;
  team.stats.goalDifference = team.stats.goalsFor - team.stats.goalsAgainst;

  if (result === "win") {
    team.stats.won -= 1;
    team.stats.points -= 3;
  } else if (result === "draw") {
    team.stats.drawn -= 1;
    team.stats.points -= 1;
  } else if (result === "lose") {
    team.stats.lost -= 1;
  }

  if (team.form.length > 0) {
    team.form.shift();
  }
};

export const determineMatchResult = (
  homeScore: number,
  awayScore: number
): {
  homeResult: "win" | "draw" | "lose";
  awayResult: "win" | "draw" | "lose";
} => {
  if (homeScore > awayScore) {
    return { homeResult: "win", awayResult: "lose" };
  } else if (homeScore < awayScore) {
    return { homeResult: "lose", awayResult: "win" };
  } else {
    return { homeResult: "draw", awayResult: "draw" };
  }
};

export const processMatchResult = async (
  match: Match,
  homeScore: number,
  awayScore: number
): Promise<void> => {
  const TeamModel = require("../models/team.model").default;
  const homeTeam = await TeamModel.findById(match.homeTeam);
  const awayTeam = await TeamModel.findById(match.awayTeam);

  if (!homeTeam || !awayTeam) {
    throw new Error("Không tìm thấy đội");
  }
  if (match.status === "finished") {
    const oldResult = determineMatchResult(match.score.home, match.score.away);
    revertTeamStats(homeTeam, match.score.home, match.score.away, oldResult.homeResult);
    revertTeamStats(awayTeam, match.score.away, match.score.home, oldResult.awayResult);
  }

  const result = determineMatchResult(homeScore, awayScore);
  updateTeamStats(homeTeam, homeScore, awayScore, result.homeResult);
  updateTeamStats(awayTeam, awayScore, homeScore, result.awayResult);

  await homeTeam.save();
  await awayTeam.save();

  match.score.home = homeScore;
  match.score.away = awayScore;
  match.status = "finished";
  match.playedDate = new Date();
  await match.save();
};