import fs from "node:fs/promises";
import path from "node:path";
import Database from "@replit/database";

const localCachePath = path.join(process.cwd(), ".gitstory-cache.json");

let replitDb;

function hasReplitDb() {
  return Boolean(process.env.REPLIT_DB_URL);
}

async function readLocalCache() {
  try {
    const raw = await fs.readFile(localCachePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalCache(cache) {
  await fs.writeFile(localCachePath, JSON.stringify(cache, null, 2));
}

export async function getCachedStory(username) {
  const key = `story:${username.toLowerCase()}`;

  if (hasReplitDb()) {
    replitDb ||= new Database();
    return replitDb.get(key);
  }

  const cache = await readLocalCache();
  return cache[key] ?? null;
}

export async function setCachedStory(username, story) {
  const key = `story:${username.toLowerCase()}`;

  if (hasReplitDb()) {
    replitDb ||= new Database();
    await replitDb.set(key, story);
    return;
  }

  const cache = await readLocalCache();
  cache[key] = story;
  await writeLocalCache(cache);
}

export async function getExploreStories() {
  const key = "explore:stories";

  if (hasReplitDb()) {
    replitDb ||= new Database();
    return (await replitDb.get(key)) ?? [];
  }

  const cache = await readLocalCache();
  return cache[key] ?? [];
}

export async function setExploreStories(stories) {
  const key = "explore:stories";

  if (hasReplitDb()) {
    replitDb ||= new Database();
    await replitDb.set(key, stories);
    return;
  }

  const cache = await readLocalCache();
  cache[key] = stories;
  await writeLocalCache(cache);
}
