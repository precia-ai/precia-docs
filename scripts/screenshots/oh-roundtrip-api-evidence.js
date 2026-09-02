// Captures the Open Hospital-side landing evidence for the PRECIA round trip
// documentation (integrasi-simrs/openhospital-bukti-round-trip.mdx).
//
// This is deliberately outside run.js: run.js's spec pipeline assumes every
// route lives on the PRECIA frontend (app-dev.precia.site) and logs in
// through PRECIA's own #email/#password form. This step instead calls
// Open Hospital's own API (a different origin, a different login shape:
// {username, password} against /auth/login, bearer JWT) so it cannot reuse
// lib/auth.js.
//
// WHY AN API SCREENSHOT INSTEAD OF A UI SCREENSHOT
// Open Hospital's web UI has no screen yet that shows the PRECIA AI result to
// a clinician. The panel exists as code on the openhospital-ui branch
// feat/precia-ai-result-display (ExamTable.tsx / LaboratoryDetails.tsx), but
// that branch is not pushed to Gitea and not deployed anywhere. Once it is,
// replace this script's output with a real UI screenshot taken through
// run.js (or a twin of this script pointed at the Open Hospital UI origin)
// and update the round-trip page to show the clinician's actual view instead
// of a raw API response.
//
// NOT YET RUN. Needs OH_BASE_URL, OH_USERNAME, OH_PASSWORD (the connector's
// own read account has no callback-read permission; use an account holding
// precia_integration.push or precia_integration.callback, e.g. the callback
// account already issued for this org) and SHOT_DIR in the environment.

const { chromium } = require('playwright')

const OH_BASE_URL = process.env.OH_BASE_URL
const OH_USERNAME = process.env.OH_USERNAME
const OH_PASSWORD = process.env.OH_PASSWORD
const SOURCE_TYPE = process.env.SOURCE_TYPE || 'laboratory'
const SOURCE_CODE = process.env.SOURCE_CODE || '500001'
const SHOT_DIR = process.env.SHOT_DIR

function renderHtml(json, status) {
	const pretty = JSON.stringify(json, null, 2)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
	const url = `${OH_BASE_URL}/precia-integration/ai-results/${SOURCE_TYPE}/${SOURCE_CODE}`
	return `<!doctype html><html><head><meta charset="utf-8"><style>
		body { margin: 0; padding: 32px; background: #0f172a; font-family: ui-monospace, monospace; }
		.label { color: #94a3b8; font-size: 13px; margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase; }
		.request { background: #1e293b; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
		.request .url { color: #e2e8f0; font-size: 15px; word-break: break-all; }
		.request .status { color: #4ade80; font-size: 14px; margin-top: 6px; }
		pre { margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #e2e8f0; }
	</style></head><body>
		<div class="label">Open Hospital, hasil AI tersimpan</div>
		<div class="request" id="request-block">
			<div class="url">GET ${url}</div>
			<div class="status">HTTP ${status}</div>
		</div>
		<pre id="json-block">${pretty}</pre>
	</body></html>`
}

;(async () => {
	if (!OH_BASE_URL || !OH_USERNAME || !OH_PASSWORD || !SHOT_DIR) {
		console.error('missing OH_BASE_URL / OH_USERNAME / OH_PASSWORD / SHOT_DIR')
		process.exit(2)
	}

	const browser = await chromium.launch({ headless: true })
	const context = await browser.newContext({ viewport: { width: 1100, height: 700 } })
	const page = await context.newPage()

	const request = context.request
	const loginResp = await request.post(`${OH_BASE_URL}/auth/login`, {
		data: { username: OH_USERNAME, password: OH_PASSWORD },
		headers: { 'Content-Type': 'application/json' }
	})
	if (!loginResp.ok()) {
		console.error('login failed', loginResp.status(), await loginResp.text())
		await browser.close()
		process.exit(1)
	}
	const loginBody = await loginResp.json()
	const token = loginBody.token || loginBody.access_token || loginBody.access
	if (!token) {
		console.error('login response has no recognizable token field:', Object.keys(loginBody))
		await browser.close()
		process.exit(1)
	}

	const resultResp = await request.get(
		`${OH_BASE_URL}/precia-integration/ai-results/${SOURCE_TYPE}/${SOURCE_CODE}`,
		{ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
	)
	const resultBody = await resultResp.json().catch(() => ({ error: 'non-JSON response', status: resultResp.status() }))
	const status = resultResp.status()
	console.log('result status', status)

	await page.setContent(renderHtml(resultBody, status))

	const rawPath = `${SHOT_DIR}/openhospital-roundtrip-03-hasil-tersimpan-oh.raw.png`
	const finalPath = `${SHOT_DIR}/openhospital-roundtrip-03-hasil-tersimpan-oh.png`
	await page.screenshot({ path: rawPath })

	// Annotate with the same sharp-based overlay used by run.js, so this
	// evidence screenshot follows the same "every screenshot gets an
	// annotation" rule as every other step on this page.
	const { annotate } = require('./lib/annotate')
	const requestBox = await page.locator('#request-block').boundingBox()
	const jsonBox = await page.locator('#json-block').boundingBox()
	const annotations = []
	if (requestBox) {
		annotations.push({
			type: 'box',
			x: Math.round(requestBox.x - 8),
			y: Math.round(requestBox.y - 8),
			width: Math.round(requestBox.width + 16),
			height: Math.round(requestBox.height + 16)
		})
	}
	if (jsonBox) {
		// Only the validation_status/synced_at tail matters for the reader;
		// approximate its position as the bottom slice of the JSON block
		// rather than boxing the whole payload.
		const lineHeight = 22.4 // matches pre { font-size:14px; line-height:1.6 }
		const tailHeight = lineHeight * 2 + 12
		annotations.push({
			type: 'box',
			x: Math.round(jsonBox.x - 8),
			y: Math.round(jsonBox.y + jsonBox.height - tailHeight - lineHeight),
			width: Math.round(jsonBox.width + 16),
			height: Math.round(tailHeight + lineHeight)
		})
	}
	await annotate(rawPath, finalPath, annotations)
	require('node:fs').unlinkSync(rawPath)

	await browser.close()
})().catch((e) => {
	console.error('FAILED', e.message)
	process.exit(1)
})
