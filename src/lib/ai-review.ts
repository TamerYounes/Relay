/**
 * Where the AI review step sends diffs. It runs against a local Ollama server,
 * so it's on in local development and off on Vercel unless OLLAMA_URL points
 * at a reachable server. With no URL, reviews run the rule-based checks only.
 */
export function getOllamaUrl(): string | null {
  if (process.env.OLLAMA_URL) {
    return process.env.OLLAMA_URL;
  }

  return process.env.VERCEL ? null : "http://127.0.0.1:11434";
}

export function aiReviewEnabled() {
  return getOllamaUrl() !== null;
}
