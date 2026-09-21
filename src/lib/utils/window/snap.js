// Wider edge targets, with a small release margin to prevent flickering at the boundary.
export function snapTarget(pointerX, viewportWidth, previous = false) {
	if (viewportWidth <= 640) return false;
	const zone = Math.min(160, Math.max(96, viewportWidth * 0.12));
	if (pointerX <= zone + (previous === 'left' ? 24 : 0)) return 'left';
	if (pointerX >= viewportWidth - zone - (previous === true ? 24 : 0)) return true;
	return false;
}
