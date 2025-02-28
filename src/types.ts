// Railway API types

// General types
export interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  environments?: Environment[]; // TODO: fix this to not be optional -- bypassing for now in createProject
  services?: Service[]; // TODO: fix this to not be optional -- bypassing for now in createProject
  teamId?: string;
}

export interface Environment {
  id: string;
  name: string;
  projectId: string;
}

export interface Service {
  id: string;
  name: string;
  projectId: string;
}

export interface ServiceInstance {
  id: string;
  serviceId: string;
  serviceName: string;
  environmentId: string;
  buildCommand?: string;
  startCommand?: string;
  rootDirectory?: string;
  region?: string;
  healthcheckPath?: string;
  sleepApplication?: boolean;
  numReplicas?: number;
}

export interface Deployment {
  id: string;
  serviceId: string;
  environmentId: string;
  status: 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'REMOVED' | 'CANCELED';
  createdAt: string;
  staticUrl?: string;
  url?: string;
  canRedeploy?: boolean;
  canRollback?: boolean;
}

export interface Variable {
  name: string;
  value: string;
  serviceId?: string;
  environmentId: string;
  projectId: string;
}

export interface ToolResult {
  isError?: boolean;
  content: {
    type: "text";
    text: string;
  }[];
  [key: string]: unknown;
}

// GraphQL API responses
export interface GraphQLResponse<T> {
  data?: T;
  errors?: {
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[];
  }[];
}

export interface MeResponse {
  me: {
    id: string;
    name: string;
    email: string;
    projects: {
      edges: {
        node: Project & {
          environments: {
            edges: {
              node: Environment;
            }[];
          };
          services: {
            edges: {
              node: Service;
            }[];
          };
        };
      }[];
    };
  };
}

export interface ProjectResponse {
  project: Project & {
    environments: {
      edges: {
        node: Environment;
      }[];
    };
    services: {
      edges: {
        node: Service;
      }[];
    };
  };
}

export interface ProjectsResponse {
  projects: {
    edges: {
      node: Project;
    }[];
  };
}

export interface ServicesResponse {
  services: {
    edges: {
      node: Service;
    }[];
  };
}

export interface EnvironmentsResponse {
  environments: {
    edges: {
      node: Environment;
    }[];
  };
}

export interface DeploymentsResponse {
  deployments: {
    edges: {
      node: Deployment;
    }[];
  };
}

export interface VariablesResponse {
  variables: Record<string, string>;
}

// API input types
export interface ServiceCreateInput {
  projectId: string;
  name?: string;
  source?: {
    repo?: string;
    image?: string;
  };
}

export interface VariableUpsertInput {
  projectId: string;
  environmentId: string;
  serviceId?: string;
  name: string;
  value: string;
}

export interface VariableDeleteInput {
  projectId: string;
  environmentId: string;
  serviceId?: string;
  name: string;
}

export interface DeploymentsFilter {
  projectId: string;
  environmentId?: string;
  serviceId: string;
  limit?: number;
}

export interface DeploymentLog {
  timestamp: string;
  message: string;
  severity?: string;
  attributes?: Record<string, string>;
}

export interface DeploymentTriggerInput {
  projectId: string;
  serviceId: string;
  environmentId: string;
  commitSha?: string;
}
