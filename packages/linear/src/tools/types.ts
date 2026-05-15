/** Linear client interface for testability */
export interface LinearClient {
  listIssues(params?: {
    teamId?: string;
    projectId?: string;
    assigneeId?: string;
    limit?: number;
    state?: string;
  }): Promise<LinearIssue[]>;
  getIssue(id: string): Promise<LinearIssue>;
  createIssue(data: {
    title: string;
    teamId: string;
    description?: string;
    assigneeId?: string;
    priority?: number;
    labelIds?: string[];
  }): Promise<LinearIssue>;
  updateIssue(
    id: string,
    data: {
      title?: string;
      description?: string;
      assigneeId?: string;
      priority?: number;
      stateId?: string;
    },
  ): Promise<LinearIssue>;
  listProjects(params?: { teamId?: string; limit?: number }): Promise<LinearProject[]>;
  listTeams(params?: { limit?: number }): Promise<LinearTeam[]>;
  listLabels(params?: { teamId?: string; limit?: number }): Promise<LinearLabel[]>;
  listCycles(params?: { teamId?: string; limit?: number }): Promise<LinearCycle[]>;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: string;
  priority: number;
  assignee?: string;
  createdAt: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  progress: number;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearLabel {
  id: string;
  name: string;
  color?: string;
}

export interface LinearCycle {
  id: string;
  number: number;
  name?: string;
  startsAt: string;
  endsAt: string;
}
