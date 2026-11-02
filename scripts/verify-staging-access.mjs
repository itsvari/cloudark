import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const settings = JSON.parse(await readFile(new URL("../docs/workers-builds-settings.json", import.meta.url), "utf8"));
const ownerEmail = "contact@itsvari.com";
const cloudflareIdentityProviderId = "ce327c41-1761-4b88-8986-dc8571923ba9";
const sessionDuration = "12h";
const versionPrefixLength = 8;
const cliTimeoutMs = 30_000;
const protectedPaths = {
  "apps/itsvari": ["/", "/cv/ashe-andromeda-low-cv.pdf", "/favicon.ico"],
  "apps/v4ri": ["/", "/photos/gigs/abyss-sonic-halloween-voyage.jpg", "/favicon.ico"],
};

async function readCloudflare(argumentsList) {
  let stdout;
  try {
    ({ stdout } = await executeFile("cf", argumentsList, { timeout: cliTimeoutMs }));
  } catch {
    throw new Error(`cf ${argumentsList.join(" ")} failed; check the authenticated cf CLI session.`);
  }
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`cf ${argumentsList.join(" ")} did not return valid JSON.`);
  }
}

const [workers, applications, identityProviders, currentUser] = await Promise.all([
  readCloudflare(["workers", "list"]),
  readCloudflare(["zero-trust", "access", "applications", "list"]),
  readCloudflare(["zero-trust", "identity-providers", "list"]),
  readCloudflare(["user", "get"]),
]);
assert.ok(Array.isArray(workers), "Cloudflare did not return a Worker list");
assert.ok(Array.isArray(applications), "Cloudflare did not return an Access application list");
assert.ok(Array.isArray(identityProviders), "Cloudflare did not return an identity provider list");
assert.equal(currentUser.email, ownerEmail, "Run this operator check with the owner's Cloudflare account");
const cloudflareIdentityProvider = identityProviders.find(({ id }) => id === cloudflareIdentityProviderId);
assert.equal(cloudflareIdentityProvider?.type, "cloudflare", "Staging must use the selected Cloudflare account identity provider");

function verifyOwnerPolicy(application, workerName) {
  assert.equal(application.type, "self_hosted", `${workerName}: expected an Access-protected application`);
  assert.deepEqual(application.allowed_idps, [cloudflareIdentityProviderId], `${workerName}: only the Cloudflare account identity provider may be used`);
  assert.equal(application.session_duration, sessionDuration, `${workerName}: unexpected session duration`);
  assert.equal(application.options_preflight_bypass, false, `${workerName}: preflight requests must not bypass Access`);
  assert.notEqual(application.allow_authenticate_via_warp, true, `${workerName}: WARP must not provide an alternate login method`);
  assert.equal(application.policies?.length, 1, `${workerName}: expected exactly one owner-only policy`);
  const [policy] = application.policies;
  assert.equal(policy.decision, "allow", `${workerName}: bypass and service-auth policies are not permitted`);
  assert.deepEqual(policy.include, [{ email: { email: ownerEmail } }], `${workerName}: only the exact owner email may be included`);
  assert.deepEqual(policy.require, [{ login_method: { id: cloudflareIdentityProviderId } }], `${workerName}: the policy must require the Cloudflare account login method`);
  assert.deepEqual(policy.exclude, [], `${workerName}: unexpected policy exclusions`);
  assert.ok(policy.session_duration === undefined || policy.session_duration === sessionDuration, `${workerName}: the policy must not override the 12-hour session`);
}

async function assertAnonymousDenied(url, label) {
  const response = await fetch(url, { redirect: "manual", headers: { Accept: "text/html" } });
  assert.equal(response.status, 302, `${label}: anonymous traffic must redirect to Access, received ${response.status}`);
  const location = response.headers.get("location");
  assert.ok(location, `${label}: Access redirect has no Location header`);
  const login = new URL(location, url);
  assert.equal(login.protocol, "https:", `${label}: Access login must use HTTPS`);
  assert.ok(login.hostname.endsWith(".cloudflareaccess.com"), `${label}: redirect is not a Cloudflare Access login`);
  assert.ok(login.pathname.startsWith("/cdn-cgi/access/login/"), `${label}: redirect is not an Access authentication endpoint`);
  await response.body?.cancel();
}

async function verifyStagingProject(project) {
  const worker = workers.find(({ name }) => name === project.workerName);
  assert.ok(worker, `${project.workerName}: staging Worker is missing`);
  const workerApplications = applications.filter((application) => application.destinations?.some((destination) => destination.type === "worker" && destination.worker_id === worker.id));
  assert.equal(workerApplications.length, 1, `${project.workerName}: expected exactly one whole-Worker Access application`);
  const [application] = workerApplications;
  assert.deepEqual(application.destinations, [{ type: "worker", worker_id: worker.id }], `${project.workerName}: Access must protect the entire Worker, not only a hostname or path`);
  verifyOwnerPolicy(application, project.workerName);

  const [details, deploymentHistory] = await Promise.all([
    readCloudflare(["workers", "get", worker.id]),
    readCloudflare(["workers", "deployments", "list", "--worker", project.workerName]),
  ]);
  assert.ok(details.subdomain?.enabled, `${project.workerName}: expected an active workers.dev staging URL`);
  const base = new URL(details.subdomain.url);
  assert.equal(base.protocol, "https:");
  assert.ok(base.hostname.endsWith(".workers.dev"), `${project.workerName}: unexpected staging host`);
  const paths = protectedPaths[project.rootDirectory];
  assert.ok(paths, `${project.workerName}: no static-asset probes are configured`);
  await Promise.all(paths.map((path) => assertAnonymousDenied(new URL(path, base), `${project.workerName} ${path}`)));

  const activeDeployment = deploymentHistory.deployments?.[0];
  const activeVersions = activeDeployment?.versions?.filter(({ percentage }) => percentage > 0) ?? [];
  const previewSuffix = details.subdomain.preview_url_suffix;
  assert.ok(details.subdomain.previews_enabled, `${project.workerName}: version previews are expected to be enabled and protected`);
  assert.ok(typeof previewSuffix === "string" && previewSuffix.endsWith(`-${base.hostname}`), `${project.workerName}: cannot derive the current version-preview hostname`);
  assert.ok(activeVersions.length > 0, `${project.workerName}: no active deployment versions are available to verify`);
  await Promise.all(activeVersions.map(async ({ version_id: versionId }) => {
    assert.match(versionId, /^[a-f0-9-]{36}$/, `${project.workerName}: invalid deployed version ID`);
    const preview = new URL(`https://${versionId.slice(0, versionPrefixLength)}${previewSuffix}`);
    await Promise.all(paths.map((path) => assertAnonymousDenied(new URL(path, preview), `${project.workerName} current version ${path}`)));
  }));
  console.log(`${project.workerName}: whole-Worker Access, owner-only Cloudflare login, 12-hour session and anonymous home/static/version denial verified`);
}

const stagingProjects = settings.projects.filter(({ environment }) => environment === "staging");
assert.equal(stagingProjects.length, 2, "Expected exactly two staging Workers in the build settings");
await Promise.all(stagingProjects.map(verifyStagingProject));
