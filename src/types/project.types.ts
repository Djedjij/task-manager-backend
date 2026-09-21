export type TProjectResponse = {
  id: string;
  title: string;
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
  title: string;
  description?: string;
};

export type TUpdateProjectDto = {
  title?: string;
  description?: string;
};

export type TAddProjectMemberDto = {
  userId: string;
  role?: string;
};