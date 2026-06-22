export interface StreakData {
  streakCount: number;
  lastActionDate: string | null; // 'YYYY-MM-DD'
  lastActionTime: number | null; // timestamp
}

export const getStreakData = (userId: string): StreakData => {
  const resolvedUid = userId || 'current';
  const countKey = `unihub_${resolvedUid}_streak_count`;
  const dateKey = `unihub_${resolvedUid}_streak_last_date`;
  const timeKey = `unihub_${resolvedUid}_streak_last_time`;

  const countVal = localStorage.getItem(countKey);
  const count = countVal ? parseInt(countVal, 10) : 0;
  const date = localStorage.getItem(dateKey);
  const time = localStorage.getItem(timeKey);

  const todayStr = new Date().toISOString().split('T')[0];

  if (date) {
    const lastDate = new Date(date);
    const today = new Date(todayStr);
    
    // Reset time components for accurate date difference
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      // Streak broken, write 0 back to localstorage
      localStorage.setItem(countKey, '0');
      return { streakCount: 0, lastActionDate: date, lastActionTime: time ? parseInt(time, 10) : null };
    }
  }

  return {
    streakCount: count,
    lastActionDate: date,
    lastActionTime: time ? parseInt(time, 10) : null
  };
};

export const recordAcademicAction = (userId: string, actionType: string): { incremented: boolean, newStreak: number } => {
  const resolvedUid = userId || 'current';
  const countKey = `unihub_${resolvedUid}_streak_count`;
  const dateKey = `unihub_${resolvedUid}_streak_last_date`;
  const timeKey = `unihub_${resolvedUid}_streak_last_time`;

  const todayStr = new Date().toISOString().split('T')[0];
  const now = Date.now();

  const currentStreak = getStreakData(resolvedUid);
  let newStreak = currentStreak.streakCount;
  let incremented = false;

  if (currentStreak.lastActionDate === todayStr) {
    // Action already performed today, streak remains the same
    localStorage.setItem(timeKey, now.toString());
  } else if (currentStreak.lastActionDate === getYesterdayStr()) {
    // Action performed yesterday, increment streak
    newStreak = currentStreak.streakCount + 1;
    localStorage.setItem(countKey, newStreak.toString());
    localStorage.setItem(dateKey, todayStr);
    localStorage.setItem(timeKey, now.toString());
    incremented = true;
  } else {
    // Last action was older than yesterday (or none), reset/start at 1
    newStreak = 1;
    localStorage.setItem(countKey, newStreak.toString());
    localStorage.setItem(dateKey, todayStr);
    localStorage.setItem(timeKey, now.toString());
    incremented = true;
  }

  // Dispatch global event so UI (like Dashboard) knows to refresh the streak immediately
  try {
    window.dispatchEvent(new CustomEvent('unihub_action_recorded', { detail: { actionType, newStreak } }));
  } catch (e) {
    console.error(e);
  }

  return { incremented, newStreak };
};

const getYesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};
