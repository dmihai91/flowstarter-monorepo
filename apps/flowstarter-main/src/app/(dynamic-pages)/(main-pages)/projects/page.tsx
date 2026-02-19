import { getAllProjects } from '@/data/user/projects';
import { ProjectsList } from '../components/ProjectsList';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return <ProjectsList projects={projects} />;
}
