import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
	try {
		const body = await request.json();
		const hostname = body.hostname
			?.toLowerCase()
			.trim()
			.replace(/^https?:\/\//, '')
			.replace(/\/.*$/, '');

		if (!hostname || !hostname.includes('.')) {
			return json(
				{ success: false, error: 'Invalid domain' },
				{ status: 400 }
			);
		}

		if (!/^[a-z0-9.-]+$/.test(hostname)) {
			return json(
				{ success: false, error: 'Invalid domain' },
				{ status: 400 }
			);
		}

		const env = /** @type {any} */ (platform?.env);

const token = env?.CLOUDFLARE_API_TOKEN;
const zoneId = env?.CF_ZONE_ID;

		if (!token || !zoneId) {
			return json(
				{
					success: false,
					error: 'Cloudflare configuration is missing'
				},
				{ status: 500 }
			);
		}

		const cfResponse = await fetch(
			`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					hostname,
					ssl: {
						method: 'http',
						type: 'dv'
					}
				})
			}
		);

		const cfData = await cfResponse.json();

		if (!cfResponse.ok || !cfData.success) {
			return json(
				{
					success: false,
					error:
						cfData.errors?.[0]?.message ??
						'Cloudflare rejected the domain'
				},
				{ status: cfResponse.status }
			);
		}

		return json({
			success: true,
			hostname,
			customHostnameId: cfData.result.id,
			status: cfData.result.status,
			cnameTarget: 'customers.formative.icu'
		});
	} catch (error) {
		console.error(error);

		return json(
			{ success: false, error: 'Server error' },
			{ status: 500 }
		);
	}
}