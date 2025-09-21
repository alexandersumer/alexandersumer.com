export const formatDisplayDate = (date?: Date) =>
  date
    ? date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;
