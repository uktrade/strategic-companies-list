export const isFeatureFlagActive = (flags, key) => {
  const obj = flags.find((obj) => Object.hasOwn(obj, key));
  return Boolean(obj[key]);
};
