<script>
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	let { label, onclose, children, palette = false } = $props();
	function spatial(node) {
		return fly(node, {
			y: 8,
			duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180,
			easing: cubicOut
		});
	}
	function mountDialog(node) {
		node.showModal();
		const input = node.querySelector('input');
		input?.focus();
		input?.select();
		return {
			destroy() {
				node.close();
			}
		};
	}
	function backdropClick(event) {
		if (event.target !== event.currentTarget) return;
		const rect = event.currentTarget.getBoundingClientRect();
		if (
			event.clientX < rect.left ||
			event.clientX > rect.right ||
			event.clientY < rect.top ||
			event.clientY > rect.bottom
		)
			onclose();
	}
</script>

<dialog
	class="zen-dialog"
	class:palette
	aria-label={label}
	use:mountDialog
	onclick={backdropClick}
	oncancel={(event) => {
		event.preventDefault();
		onclose();
	}}
	transition:spatial
>
	{@render children()}
</dialog>
