type DurationInput = {
  startTime: Date;
  endTime?: Date | null;
  pausedDurationMs?: number;
  pauseStartedAt?: Date | null;
};

export const calculateDurationMinutes = ({
  startTime,
  endTime,
  pausedDurationMs = 0,
  pauseStartedAt
}: DurationInput) => {
  const actualEndTime = endTime ?? new Date();
  const end = actualEndTime.getTime();
  const start = startTime.getTime();
  const currentPauseMs = pauseStartedAt ? Math.max(0, end - pauseStartedAt.getTime()) : 0;
  const billableMs = Math.max(0, end - start - pausedDurationMs - currentPauseMs);

  if (billableMs === 0) {
    return 0;
  }

  return Math.ceil(billableMs / 60000);
};

export const calculateTotalPrice = (baseFee: number, pricePerMinute: number, durationMinutes: number) =>
  baseFee + durationMinutes * pricePerMinute;
