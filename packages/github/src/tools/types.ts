/** GitHub API client interface for testability */
export interface GitHubClient {
  request(method: string, path: string, body?: unknown): Promise<unknown>;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  updated_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  body: string | null;
  user: { login: string };
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  body: string | null;
  user: { login: string };
  head: { ref: string };
  base: { ref: string };
  merged: boolean;
  html_url: string;
  created_at: string;
}

export function createGitHubClient(token: string, baseUrl: string = "https://api.github.com"): GitHubClient {
  return {
    async request(method: string, path: string, body?: unknown) {
      const url = `${baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API ${method} ${path} failed (${response.status}): ${text}`);
      }
      return response.json();
    },
  };
}
