import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      progressStep: true,
      progressPercent: true,
      errorMessage: true,
      framework: true,
      fileCount: true,
      report: {
        select: { healthScore: true },
      },
    },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(project);
}

