import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getCachedStory, getExploreStories, setCachedStory, setExploreStories } from "./cache.js";
import { fetchGitHubData } from "./github.js";
import { generateGitStory } from "./openai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPayload(username, githubData, aiResult, generatedInSeconds, cached = false) {
  return {
    username,
    generatedAt: new Date().toISOString(),
    generatedInSeconds,
    cached,
    github: githubData,
    story: aiResult.ai,
    model: aiResult.model,
    usedFallback: aiResult.usedFallback
  };
}

function buildExploreSummary(payload) {
  const profile = payload.github.profile;
  const computed = payload.github.computed;

  return {
    username: profile.login,
    name: profile.name,
    avatar: profile.avatar_url,
    generatedAt: payload.generatedAt,
    type: payload.story.builder_type,
    headline: payload.story.headline,
    tags: computed.top_languages.map((language) => language.name).slice(0, 3),
    stars: computed.total_stars,
    repos: profile.public_repos,
    followers: profile.followers
  };
}

async function addExploreStory(payload) {
  const summary = buildExploreSummary(payload);
  const stories = await getExploreStories();
  const nextStories = [
    summary,
    ...stories.filter((story) => story.username.toLowerCase() !== summary.username.toLowerCase())
  ].slice(0, 48);
  await setExploreStories(nextStories);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "GitStory" });
});

app.get("/api/explore", async (_req, res) => {
  try {
    const stories = await getExploreStories();
    res.json({ stories, count: stories.length });
  } catch (error) {
    console.error("Explore list error:", error);
    res.status(500).json({ message: "Unable to load generated GitStories." });
  }
});

app.get("/api/story/:username", async (req, res) => {
  const username = req.params.username.trim();
  const regenerate = req.query.regenerate === "true" || req.query.regenerate === "1";
  const started = Date.now();

  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return res.status(400).json({ message: "That does not look like a valid GitHub username." });
  }

  try {
    if (!regenerate) {
      const cached = await getCachedStory(username);
      if (cached) {
        await addExploreStory(cached);
        return res.json({ ...cached, cached: true, generatedInSeconds: 0 });
      }
    }

    const githubData = await fetchGitHubData(username);
    const aiResult = await generateGitStory(username, githubData);
    const payload = buildPayload(
      githubData.profile.login,
      githubData,
      aiResult,
      Number(((Date.now() - started) / 1000).toFixed(1))
    );
    await setCachedStory(username, payload);
    await addExploreStory(payload);
    res.json(payload);
  } catch (error) {
    console.error("Story generation error:", error);
    const status = error.status || 500;
    res.status(status).json({
      message:
        status === 404
          ? "We could not find that GitHub user. Check the spelling and try a public profile."
          : "GitStory hit a snag while building this story. Please try again."
    });
  }
});

function renderIndexWithMeta(req, res) {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("Run npm run build first.");
  }

  let html = fs.readFileSync(indexPath, "utf8");
  const username = req.params.username;
  if (username) {
    const safeUsername = escapeHtml(username);
    html = html
      .replace(/<title>.*?<\/title>/, `<title>${safeUsername}'s GitStory</title>`)
      .replace('content="GitStory"', `content="${safeUsername}'s GitStory"`)
      .replace(
        'content="Turn any GitHub profile into a beautiful career story."',
        `content="A shareable interactive career story for @${safeUsername}."`
      )
      .replace('content="/og-default.png"', `content="https://github.com/${encodeURIComponent(username)}.png"`);
  }
  res.send(html);
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distDir));
  app.get("/story/:username", renderIndexWithMeta);
  app.get("*", (_req, res) => renderIndexWithMeta({ params: {} }, res));
}

app.listen(port, () => {
  console.log(`GitStory API running on http://127.0.0.1:${port}`);
});
