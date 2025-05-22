import { format, parse } from "date-fns";

// Check if a feature flag is active
export const isFeatureFlagActive = (flags, key) => {
  const obj = flags.find((obj) => Object.hasOwn(obj, key));
  return Boolean(obj[key]);
};

// Use in forms to send arrays of strings to the API.
export const transformValueToArray = (value) => {
  if (typeof value !== "string") return value;
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
};

// Use in forms to convert long date format to yyyy-MM-dd
export const transformLongDateToShort = (inputDate) => {
  const parsedDate = parse(inputDate, "MMMM d, yyyy", new Date());
  return format(parsedDate, "yyyy-MM-dd");
};
