const GITHUB_API = "https://api.github.com";

async function githubJson(path) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "GitStory"
    }
  });

  if (response.status === 404) {
    const error = new Error("GitHub user not found");
    error.status = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`GitHub API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function topCounts(items, limit = 5) {
  const counts = new Map();
  for (const item of items.filter(Boolean)) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export async function fetchGitHubData(username) {
  const cleanUsername = username.trim();
  const [profile, repos, events] = await Promise.all([
    githubJson(`/users/${encodeURIComponent(cleanUsername)}`),
    githubJson(`/users/${encodeURIComponent(cleanUsername)}/repos?sort=stars&per_page=100`),
    githubJson(`/users/${encodeURIComponent(cleanUsername)}/events?per_page=100`)
  ]);

  const sortedByStars = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count
  );
  const sortedByCreated = [...repos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const currentYear = new Date().getFullYear();
  const createdYear = new Date(profile.created_at).getFullYear();
  const topics = repos.flatMap((repo) => repo.topics ?? []);

  return {
    profile: {
      login: profile.login,
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      company: profile.company,
      followers: profile.followers,
      following: profile.following,
      public_repos: profile.public_repos,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      blog: profile.blog,
      html_url: profile.html_url
    },
    computed: {
      top_languages: topCounts(repos.map((repo) => repo.language), 5),
      total_stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      total_forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      top_repos: sortedByStars.slice(0, 6).map((repo) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        html_url: repo.html_url,
        topics: repo.topics ?? [],
        created_at: repo.created_at
      })),
      first_repo: sortedByCreated[0]
        ? {
            name: sortedByCreated[0].name,
            html_url: sortedByCreated[0].html_url,
            created_at: sortedByCreated[0].created_at
          }
        : null,
      years_on_github: Math.max(0, currentYear - createdYear),
      most_active_topics: topCounts(topics, 8)
    },
    recent_activity: events.slice(0, 20).map((event) => ({
      type: event.type,
      repo: event.repo?.name,
      created_at: event.created_at
    }))
  };
}
