// Missing values are null; an existing false/empty setting still means a returning user.
export function isNewDesktopUser(marker, savedValues, hasLegacyVisit) {
	return marker === null && !hasLegacyVisit && savedValues.every((value) => value === null);
}
