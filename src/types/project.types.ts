export type TProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TProjectMemberResponse = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: Date;
};

export type TCreateProjectDto = {
  name: string;
  description?: string;
};

export type TUpdateProjectDto = {
  name?: string;
  description?: string;
};

export type TAddProjectMemberDto = {
  userId: string;
  role?: string;
};