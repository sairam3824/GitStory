const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function fetchStory(username, regenerate = false) {
  const response = await fetch(`${API_BASE}/api/story/${username}${regenerate ? "?regenerate=1" : ""}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Unable to generate this GitStory.");
  return body;
}

export async function fetchExploreStories() {
  const response = await fetch(`${API_BASE}/api/explore`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Unable to load GitStories.");
  return body.stories ?? [];
}
