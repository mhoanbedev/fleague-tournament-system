export const determineLeagueStatus = (
  startDate?: Date | null,
  endDate?: Date | null
): "upcoming" | "ongoing" | "completed" => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 

  if (!startDate && !endDate) {
    return "upcoming";
  }
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (now < start) {
      return "upcoming";
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (now > end) {
        return "completed";
      }
      if (now >= start && now <= end) {
        return "ongoing";
      }
    } else {
      if (now >= start) {
        return "ongoing";
      }
    }
  }
  if (endDate && !startDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (now > end) {
      return "completed";
    }
    return "ongoing";
  }

  return "upcoming";
};


export const canUpdateLeague = (
  currentStatus: string,
  startDate?: Date | null
): boolean => {
  if (currentStatus === "completed") {
    return false;
  }
  if (currentStatus === "ongoing") {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (start < now) {
        return false;
      }
    }
  }

  return true;
};