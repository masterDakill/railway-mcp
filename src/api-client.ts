import {
  GraphQLResponse,
  MeResponse,
  Project,
  Environment,
  Service,
  Deployment,
  ServiceCreateInput,
  DeploymentsFilter,
  VariableUpsertInput,
  VariableDeleteInput,
  ProjectResponse,
  DeploymentsResponse,
  VariablesResponse,
  ServiceInstance,
  DeploymentTriggerInput,
  DeploymentLog
} from './types.js';

export class RailwayApiClient {
  private readonly apiUrl = 'https://backboard.railway.app/graphql/v2';
  private readonly wsUrl = 'wss://backboard.railway.app/graphql/v2';
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token || null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    if (!this.token) {
      throw new Error('API token not set. Please configure the API token first.');
    }

    const debug = process.env.DEBUG;
    const isDebug = debug === 'railway:*' || debug?.includes('railway:api');

    if (isDebug) {
      console.error('GraphQL Request:');
      console.error('Query:', query);
      console.error('Variables:', JSON.stringify(variables, null, 2));
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json() as GraphQLResponse<T>;

    if (isDebug) {
      console.error('GraphQL Response:', JSON.stringify(result, null, 2));
    }

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result.data as T;
  }

  // Authentication
  async validateToken(): Promise<{ name: string; email: string }> {
    const data = await this.request<MeResponse>(`
      query {
        me {
          name
          email
        }
      }
    `);
    
    return {
      name: data.me.name || '',
      email: data.me.email,
    };
  }

  // Projects
  async listProjects(): Promise<Project[]> {
    const data = await this.request<MeResponse>(`
      query {
        me {
          projects {
            edges {
              node {
                id
                name
                environments {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
                services {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    return data.me.projects.edges.map((edge: { node: Project & { 
      environments: { edges: { node: Environment }[] },
      services: { edges: { node: Service }[] }
    }}) => {
      const project = edge.node;
      return {
        id: project.id,
        name: project.name,
        environments: project.environments.edges.map((e: { node: Environment }) => e.node),
        services: project.services.edges.map((e: { node: Service }) => e.node),
      };
    });
  }

  async getProject(id: string): Promise<Project> {
    const data = await this.request<{ project: ProjectResponse['project'] }>(`
      query getProject($id: String!) {
        project(id: $id) {
          id
          name
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
          services {
            edges {
              node {
                id
                name
              }
              }
            }
          }
        }
      }
    `, { id });

    const project = data.project;
    return {
      id: project.id,
      name: project.name,
      environments: project.environments.edges.map(e => e.node),
      services: project.services.edges.map(e => e.node),
    };
  }

  async deleteProject(id: string): Promise<boolean> {
    const data = await this.request<{ projectDelete: boolean }>(`
      mutation projectDelete($id: String!) {
        projectDelete(id: $id)
      }
    `, { id });

    return data.projectDelete;
  }

  async createProject(name: string, teamId?: string): Promise<Project> {
    const data = await this.request<{ projectCreate: { id: string; name: string } }>(`
      mutation projectCreate($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          id
          name
        }
      }
    `, {
      input: {
        name,
        teamId,
      },
    });

    return {
      id: data.projectCreate.id,
      name: data.projectCreate.name,
    };
  }

  // Services
  async listServices(projectId: string): Promise<Service[]> {
    const data = await this.request<{ project: ProjectResponse['project'] }>(`
      query getProject($id: String!) {
        project(id: $id) {
          name
          services {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `, { id: projectId });

    return data.project.services.edges.map((edge: { node: Service }) => ({
      id: edge.node.id,
      name: edge.node.name,
      projectId,
    }));
  }

  async createService(input: ServiceCreateInput): Promise<Service> {
    const data = await this.request<{ serviceCreate: { id: string; name: string; projectId: string } }>(`
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          projectId
        }
      }
    `, { input });

    return {
      id: data.serviceCreate.id,
      name: data.serviceCreate.name,
      projectId: data.serviceCreate.projectId,
    };
  }

  async deleteService(id: string): Promise<boolean> {
    const data = await this.request<{ serviceDelete: boolean }>(`
      mutation serviceDelete($id: String!) {
        serviceDelete(id: $id)
      }
    `, { id });

    return data.serviceDelete;
  }

  // Environments
  async listEnvironments(projectId: string): Promise<Environment[]> {
    const data = await this.request<{ project: ProjectResponse['project'] }>(`
      query getProject($id: String!) {
        project(id: $id) {
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `, { id: projectId });

    return data.project.environments.edges.map((edge: { node: Environment }) => ({
      id: edge.node.id,
      name: edge.node.name,
      projectId,
    }));
  }

  async createEnvironment(projectId: string, name: string): Promise<Environment> {
    const data = await this.request<{ environmentCreate: { id: string; name: string } }>(`
      mutation environmentCreate($input: EnvironmentCreateInput!) {
        environmentCreate(input: $input) {
          id
          name
        }
      }
    `, {
      input: {
        projectId,
        name,
      },
    });

    return {
      id: data.environmentCreate.id,
      name: data.environmentCreate.name,
      projectId,
    };
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    const data = await this.request<{ environmentDelete: boolean }>(`
      mutation environmentDelete($id: String!) {
        environmentDelete(id: $id)
      }
    `, { id });

    return data.environmentDelete;
  }

  // Deployments
  async listDeployments(filter: DeploymentsFilter): Promise<Deployment[]> {
    const { projectId, serviceId, environmentId, limit } = filter;
    const data = await this.request<DeploymentsResponse>(`
      query deployments($projectId: String!, $serviceId: String!, $environmentId: String, $limit: Int) {
        deployments(
          input: {
            projectId: $projectId,
            serviceId: $serviceId,
            ${environmentId ? `environmentId: $environmentId` : ''}
          },
          first: $limit
        ) {
          edges {
            node {
              id
              status
              createdAt
              staticUrl
              url
              serviceId
              environmentId
            }
          }
        }
      }
    `, {
      projectId,
      serviceId,
      environmentId,
      limit,
    });

    return data.deployments.edges.map(edge => ({
      id: edge.node.id,
      status: edge.node.status,
      createdAt: edge.node.createdAt,
      staticUrl: edge.node.staticUrl,
      url: edge.node.url,
      serviceId: edge.node.serviceId,
      environmentId: edge.node.environmentId,
    }));
  }

  async restartDeployment(id: string): Promise<boolean> {
    const data = await this.request<{ deploymentRestart: boolean }>(`
      mutation deploymentRestart($id: String!) {
        deploymentRestart(id: $id)
      }
    `, { id });

    return data.deploymentRestart;
  }

  async redeployService(id: string, environmentId: string, serviceId: string): Promise<string> {
    const data = await this.request<{ serviceInstanceDeployV2: string }>(`
      mutation serviceInstanceDeployV2($environmentId: String!, $serviceId: String!) {
        serviceInstanceDeployV2(environmentId: $environmentId, serviceId: $serviceId)
      }
    `, { 
      environmentId,
      serviceId 
    });

    return data.serviceInstanceDeployV2;
  }

  // Variables
  async getVariables(projectId: string, environmentId: string, serviceId?: string): Promise<Record<string, string>> {
    const data = await this.request<VariablesResponse>(`
      query variables($projectId: String!, $environmentId: String!, $serviceId: String) {
        variables(
          projectId: $projectId
          environmentId: $environmentId
          serviceId: $serviceId
        )
      }
    `, {
      projectId,
      environmentId,
      serviceId,
    });

    return data.variables;
  }

  async upsertVariable(input: VariableUpsertInput): Promise<boolean> {
    const data = await this.request<{ variableUpsert: boolean }>(`
      mutation variableUpsert($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }
    `, { input });

    return data.variableUpsert;
  }

  async deleteVariable(input: VariableDeleteInput): Promise<boolean> {
    const data = await this.request<{ variableDelete: boolean }>(`
      mutation variableDelete($input: VariableDeleteInput!) {
        variableDelete(input: $input)
      }
    `, { input });

    return data.variableDelete;
  }

  // Bulk variable operations
  async upsertVariables(variables: VariableUpsertInput[]): Promise<void> {
    // Use variableCollectionUpsert mutation for bulk updates
    await this.request<{ variableCollectionUpsert: boolean }>(`
      mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `, {
      input: {
        variables: variables.map(({ projectId, environmentId, serviceId, name, value }) => ({
          projectId,
          environmentId,
          serviceId,
          name,
          value,
        })),
      },
    });
  }

  // Service instance management
  async getServiceInstance(serviceId: string, environmentId: string): Promise<ServiceInstance | null> {
    const data = await this.request<{ serviceInstance: ServiceInstance }>(`
      query serviceInstance($environmentId: String!, $serviceId: String!) {
        serviceInstance(environmentId: $environmentId, serviceId: $serviceId) {
          id
          serviceId
          serviceName
          environmentId
          buildCommand
          startCommand
          rootDirectory
          region
          healthcheckPath
          sleepApplication
          numReplicas
        }
      }
    `, { serviceId, environmentId });

    return data.serviceInstance || null;
  }

  async updateServiceInstance(serviceId: string, environmentId: string, input: Partial<ServiceInstance>): Promise<void> {
    await this.request<{ serviceInstanceUpdate: boolean }>(`
      mutation serviceInstanceUpdate($environmentId: String!, $input: ServiceInstanceUpdateInput!, $serviceId: String!) {
        serviceInstanceUpdate(environmentId: $environmentId, input: $input, serviceId: $serviceId)
      }
    `, {
      serviceId,
      environmentId,
      input,
    });
  }

  async restartService(serviceId: string, environmentId: string): Promise<void> {
    await this.request<{ serviceInstanceRedeploy: boolean }>(`      mutation serviceInstanceRedeploy($environmentId: String!, $serviceId: String!) {
        serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
      }
    `, { serviceId, environmentId });
  }

  // Deployment management
  async getDeployment(id: string): Promise<Deployment | null> {
    const data = await this.request<{ deployment: Deployment }>(`
      query deployment($id: String!) {
        deployment(id: $id) {
          id
          status
          createdAt
          serviceId
          environmentId
          url
          staticUrl
          canRedeploy
          canRollback
        }
      }
    `, { id });

    return data.deployment || null;
  }

  async triggerDeployment(input: DeploymentTriggerInput): Promise<string> {
    const { commitSha, environmentId, serviceId } = input;
    const data = await this.request<{ serviceInstanceDeployV2: string }>(`
      mutation serviceInstanceDeployV2($commitSha: String, $environmentId: String!, $serviceId: String!) {
        serviceInstanceDeployV2(
          commitSha: $commitSha
          environmentId: $environmentId
          serviceId: $serviceId
        )
      }
    `, { commitSha, environmentId, serviceId });

    return data.serviceInstanceDeployV2;
  }

  async getBuildLogs(deploymentId: string, limit: number = 100): Promise<DeploymentLog[]> {
    const data = await this.request<{ buildLogs: DeploymentLog[] }>(`
      query buildLogs($deploymentId: String!, $limit: Int) {
        buildLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp
          message
          severity
          attributes
        }
      }
    `, { deploymentId, limit });

    return data.buildLogs || [];
  }

  async getDeploymentLogs(deploymentId: string, limit: number = 100): Promise<DeploymentLog[]> {
    const data = await this.request<{ deploymentLogs: DeploymentLog[] }>(`
      query deploymentLogs($deploymentId: String!, $limit: Int) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp
          message
          severity
          attributes
        }
      }
    `, { deploymentId, limit });

    return data.deploymentLogs || [];
  }

  async rollbackDeployment(id: string): Promise<void> {
    await this.request<{ deploymentRollback: boolean }>(`
      mutation deploymentRollback($id: String!) {
        deploymentRollback(id: $id)
      }
    `, { id });
  }

  async cancelDeployment(id: string): Promise<void> {
    await this.request<{ deploymentCancel: boolean }>(`
      mutation deploymentCancel($id: String!) {
        deploymentCancel(id: $id)
      }
    `, { id });
  }

  async getLiveLogs(serviceId: string, environmentId: string): Promise<WebSocket> {
    if (!this.token) {
      throw new Error('API token not set. Please configure the API token first.');
    }

    const ws = new WebSocket(this.wsUrl, 'graphql-transport-ws');
    
    ws.onopen = () => {
      // Initialize connection
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: { Authorization: `Bearer ${this.token}` }
      }));

      // Subscribe to logs
      ws.send(JSON.stringify({
        id: '1',
        type: 'subscribe',
        payload: {
          query: `subscription logs($serviceId: String!, $environmentId: String!) {
            logs(serviceId: $serviceId, environmentId: $environmentId) {
              message
              timestamp
              severity
            }
          }`,
          variables: { serviceId, environmentId }
        }
      }));
    };

    return ws;
  }
}

// Create singleton instance
export const railwayApi = new RailwayApiClient();

