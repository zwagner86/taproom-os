export type SortableBooking = {
  purchaserName: string;
  partySize: number;
  checkedInCount: number;
};

export function applyCheckInDelta(currentCount: number, partySize: number, delta: number) {
  return Math.max(0, Math.min(partySize, currentCount + delta));
}

export function getLiveCheckInBucket(booking: SortableBooking) {
  if (booking.checkedInCount > 0 && booking.checkedInCount < booking.partySize) {
    return 0;
  }

  if (booking.checkedInCount === 0) {
    return 1;
  }

  return 2;
}

export function sortBookingsForCheckIn<TBooking extends SortableBooking>(bookings: TBooking[]) {
  return [...bookings].sort((left, right) => {
    const bucketCompare = getLiveCheckInBucket(left) - getLiveCheckInBucket(right);

    if (bucketCompare !== 0) {
      return bucketCompare;
    }

    return left.purchaserName.localeCompare(right.purchaserName);
  });
}

