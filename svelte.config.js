import adapter from "@sveltejs/adapter-cloudflare";
import staticPackage from "./scripts/s3-adapter.mjs";
import { relative, sep } from "node:path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		warningFilter: (warning) => !warning.code.startsWith("a11y"),
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes("node_modules");

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: { adapter: process.env.VELORA_S3_EXPORT === '1' ? staticPackage() : adapter() }
};

export default config;
