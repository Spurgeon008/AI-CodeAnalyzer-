import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readProjectFile } from "@/lib/files/explorer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim();
    const filePath = searchParams.get("file")?.trim();

    if (!projectId || !filePath) {
      return Response.json(
        { error: "projectId and file query parameters are required." },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const file = await readProjectFile(projectId, filePath);
    if (!file) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json({ content: file.content });
  } catch (error) {
    console.error("Explorer file API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load file" },
      { status: 500 },
    );
  }
}

