export const DEFAULT_DOCK_SIZE = 24;
export const MIN_DOCK_SIZE = 20;
export const MAX_DOCK_SIZE = 39;

export function clampDockSize(size) {
	return Math.max(MIN_DOCK_SIZE, Math.min(size, MAX_DOCK_SIZE));
}

export function restoreDockSize(savedSize) {
	const size = Number(savedSize);
	// Older docks could shrink the app icons to 12px. Restore a readable size.
	return Number.isFinite(size) && size >= MIN_DOCK_SIZE ? clampDockSize(size) : DEFAULT_DOCK_SIZE;
}

export function dockHeight(savedSize) {
	return 40 + restoreDockSize(savedSize);
}
