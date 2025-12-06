export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getProgress = (currentSession: { duration: number } | null, timeRemaining: number): number => {
  if (!currentSession) return 0;
  const totalSeconds = currentSession.duration * 60;
  const elapsed = totalSeconds - timeRemaining;
  return (elapsed / totalSeconds) * 100;
};

export const getTemplateProgress = (template: { sessions: unknown[] } | null, sessionIndex: number): number => {
  if (!template) return 0;
  return ((sessionIndex + 1) / template.sessions.length) * 100;
};
