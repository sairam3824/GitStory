import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are a master storyteller who specializes in turning developer GitHub profiles into compelling career narratives. You write with warmth, wit, and genuine insight. You find the human story behind the commits.\nReturn ONLY valid JSON matching the exact schema requested. No markdown.";

const builderTypes = [
  "The Architect",
  "The Experimenter",
  "The Problem Solver",
  "The Open Source Hero",
  "The Polyglot",
  "The Specialist"
];

function fallbackStory(username, githubData) {
  const name = githubData.profile.name || username;
  const topLanguage = githubData.computed.top_languages[0]?.name || "code";
  const repoCount = String(githubData.profile.public_repos ?? githubData.computed.top_repos.length);
  const starCount = String(githubData.computed.total_stars);
  const topic = githubData.computed.most_active_topics[0]?.name || "useful ideas";

  return {
    headline: `${name} turns ${topLanguage} into durable developer momentum`,
    origin_story: `${name} opened their GitHub account in ${new Date(githubData.profile.created_at).getFullYear()}, and the trail has been accumulating ever since. The early repositories read like a builder finding their footing, then steadily choosing bigger problems to make tangible.`,
    superpower: `Their clearest superpower is turning ${topLanguage} and ${topic} into practical projects people can inspect, fork, and learn from.`,
    builder_type: githubData.computed.top_languages.length >= 5 ? "The Polyglot" : "The Problem Solver",
    builder_type_description:
      "This builder follows curiosity until it becomes a working repository. Their profile suggests someone who learns in public and keeps refining the craft.",
    chapter_titles: [
      {
        title: "First sparks",
        description:
          "The earliest repos show a developer willing to publish the messy middle. That matters, because momentum usually starts before polish arrives."
      },
      {
        title: "Patterns emerge",
        description: `Across ${repoCount} public repositories, a recognizable rhythm appears. Languages, topics, and stars begin to sketch the shape of a builder with staying power.`
      },
      {
        title: "A public body of work",
        description:
          "The profile now reads less like a folder of projects and more like a map of taste. Each repo adds another clue about what they care enough to build."
      }
    ],
    fun_stats: [
      { label: "Repos", value: repoCount, insight: `That is ${repoCount} ideas that refused to stay in their head.` },
      { label: "Stars", value: starCount, insight: "Tiny public signals that someone else found the work worth saving." },
      {
        label: "Followers",
        value: String(githubData.profile.followers),
        insight: "A quiet audience for the next commit."
      },
      {
        label: "Years",
        value: String(githubData.computed.years_on_github),
        insight: "Enough time for experiments to become instincts."
      }
    ],
    legacy_statement: `${name}'s GitHub is proof that careers are built one public bet at a time.`,
    cta_message:
      "Keep building where people can see the work. The next repository might be the one that explains the whole journey."
  };
}

function normalizeStory(story) {
  const chapters = Array.isArray(story.chapter_titles) ? story.chapter_titles.slice(0, 3) : [];
  const stats = Array.isArray(story.fun_stats) ? story.fun_stats.slice(0, 4) : [];

  return {
    headline: String(story.headline || "A developer story still being written").slice(0, 140),
    origin_story: String(story.origin_story || ""),
    superpower: String(story.superpower || ""),
    builder_type: builderTypes.includes(story.builder_type) ? story.builder_type : "The Problem Solver",
    builder_type_description: String(story.builder_type_description || ""),
    chapter_titles: chapters.map((chapter) => ({
      title: String(chapter.title || "Next chapter"),
      description: String(chapter.description || "")
    })),
    fun_stats: stats.map((stat) => ({
      label: String(stat.label || "Stat"),
      value: String(stat.value || "0"),
      insight: String(stat.insight || "")
    })),
    legacy_statement: String(story.legacy_statement || ""),
    cta_message: String(story.cta_message || "")
  };
}

export async function generateGitStory(username, githubData) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      ai: fallbackStory(username, githubData),
      model: "local-fallback",
      usedFallback: true
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the GitHub data for ${username}:
${JSON.stringify(githubData)}

Generate their GitStory. Return this exact JSON:
{
  headline: string,         // 8-12 word punchy headline about their journey
  origin_story: string,     // 2-3 sentence story of when they started coding
  superpower: string,       // Their #1 technical superpower in 1 sentence
  builder_type: string,     // One of: 'The Architect' | 'The Experimenter' |
                            // 'The Problem Solver' | 'The Open Source Hero' |
                            // 'The Polyglot' | 'The Specialist'
  builder_type_description: string,  // 2 sentences describing this type
  chapter_titles: [         // 3 chapters of their journey
    { title: string, description: string }  // description = 2 sentences
  ],
  fun_stats: [              // 4 fun interpretations of their real stats
    { label: string, value: string, insight: string }
    // example: label='Repos', value='47', insight='That is 47 ideas that refused to stay in your head'
  ],
  legacy_statement: string, // Bold 1-sentence statement of their impact
  cta_message: string       // Personalized message to keep building (2 sentences)
}`
      }
    ],
    temperature: 0.85
  });

  const content = response.choices[0]?.message?.content || "{}";
  return {
    ai: normalizeStory(JSON.parse(content)),
    model: "gpt-4o",
    usedFallback: false
  };
}
