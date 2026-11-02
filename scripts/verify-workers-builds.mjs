import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const settings = JSON.parse(await readFile(new URL("../docs/workers-builds-settings.json", import.meta.url), "utf8"));
const [repositoryOwner, repositoryName] = settings.repository.split("/");

async function readCloudflare(argumentsList) {
  const { stdout } = await executeFile("cf", argumentsList);
  return JSON.parse(stdout);
}

const workers = await readCloudflare(["workers", "list"]);
assert.ok(Array.isArray(workers), "Cloudflare did not return a Worker list");

async function verifyProject(project) {
  const worker = workers.find((candidate) => candidate.name === project.workerName);
  assert.ok(worker, `${project.workerName}: Worker is missing`);
  const triggers = await readCloudflare(["builds", "triggers", "list", "--external-script-id", worker.id]);
  assert.ok(Array.isArray(triggers), `${project.workerName}: invalid build trigger response`);
  assert.equal(triggers.length, 1, `${project.workerName}: expected exactly one build trigger`);
  const [trigger] = triggers;
  const expectedSettings = {
    build_command: settings.buildCommand,
    deploy_command: project.deployCommand,
    root_directory: project.rootDirectory,
    branch_includes: project.branchIncludes,
    branch_excludes: project.branchExcludes,
    build_caching_enabled: settings.buildCachingEnabled,
    path_includes: settings.pathIncludes,
    path_excludes: settings.pathExcludes,
  };
  for (const [name, value] of Object.entries(expectedSettings)) {
    assert.deepEqual(trigger[name], value, `${project.workerName}: ${name} differs from the reference settings`);
  }
  assert.equal(trigger.repo_connection.provider_type, "github");
  assert.equal(trigger.repo_connection.provider_account_name, repositoryOwner);
  assert.equal(trigger.repo_connection.repo_name, repositoryName);
  const variables = await readCloudflare([
    "builds", "triggers", "environment-variables", "list", "--trigger-uuid", trigger.trigger_uuid,
  ]);
  const expectedVariables = { ...settings.buildVariables, ...project.buildVariables };
  for (const [name, value] of Object.entries(expectedVariables)) {
    assert.equal(variables[name]?.value, value, `${project.workerName}: ${name} differs from the reference settings`);
    assert.equal(variables[name]?.is_secret, false, `${project.workerName}: ${name} must be readable build configuration`);
  }
  if (project.environment === "production") {
    assert.equal(variables.CLOUDFLARE_ENV, undefined, `${project.workerName}: production must use the default Wrangler environment`);
  }
  console.log(`${project.workerName}: repository, branch filters, commands and build variables verified`);
}

await Promise.all(settings.projects.map(verifyProject));
