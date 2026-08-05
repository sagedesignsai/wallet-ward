import { db } from "@/lib/db"
import type {
  ProjectFile,
  FileType,
  FileVisibility,
  FileShare,
} from "@prisma/client"

export type CreateFileInput = {
  projectId: string
  name: string
  path: string
  type: FileType
  mimeType: string
  size: number
  storageId: string
  url?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  visibility?: FileVisibility
  createdById?: string
}

export type UpdateFileInput = {
  name?: string
  path?: string
  type?: FileType
  tags?: string[]
  metadata?: Record<string, unknown>
  visibility?: FileVisibility
}

export type CreateFileShareInput = {
  fileId: string
  expiresAt?: Date
  maxDownloads?: number
  createdById?: string
}

export type FileWithVersions = ProjectFile & {
  versions?: ProjectFile[]
  parent?: ProjectFile | null
  _count?: {
    versions: number
    shares: number
  }
}

export class FileService {
  /**
   * Create a new file
   */
  static async create(input: CreateFileInput): Promise<ProjectFile> {
    return db.projectFile.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        path: input.path,
        type: input.type,
        mimeType: input.mimeType,
        size: input.size,
        storageId: input.storageId,
        url: input.url,
        tags: input.tags || [],
        metadata: input.metadata as any,
        visibility: input.visibility || "private",
        createdById: input.createdById,
      },
    })
  }

  /**
   * Create a new version of an existing file
   */
  static async createVersion(
    parentId: string,
    input: CreateFileInput
  ): Promise<ProjectFile> {
    const parent = await db.projectFile.findUnique({
      where: { id: parentId },
    })

    if (!parent) {
      throw new Error("Parent file not found")
    }

    return db.projectFile.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        path: input.path,
        type: input.type,
        mimeType: input.mimeType,
        size: input.size,
        storageId: input.storageId,
        url: input.url,
        tags: input.tags || parent.tags,
        metadata: input.metadata as any,
        visibility: input.visibility || parent.visibility,
        createdById: input.createdById,
        parentId: parentId,
        version: parent.version + 1,
      },
    })
  }

  /**
   * Get file by ID
   */
  static async getById(id: string): Promise<ProjectFile | null> {
    return db.projectFile.findUnique({
      where: { id },
    })
  }

  /**
   * Get file by ID with versions
   */
  static async getByIdWithVersions(
    id: string
  ): Promise<FileWithVersions | null> {
    return db.projectFile.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
        parent: true,
        _count: {
          select: {
            versions: true,
            shares: true,
          },
        },
      },
    })
  }

  /**
   * List files for a project
   */
  static async listByProject(
    projectId: string,
    options?: {
      type?: FileType
      path?: string
      tags?: string[]
    }
  ): Promise<ProjectFile[]> {
    return db.projectFile.findMany({
      where: {
        projectId,
        type: options?.type,
        path: options?.path ? { startsWith: options.path } : undefined,
        tags: options?.tags ? { hasSome: options.tags } : undefined,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * List files with metadata
   */
  static async listByProjectWithMetadata(
    projectId: string,
    options?: {
      type?: FileType
      path?: string
      tags?: string[]
    }
  ): Promise<FileWithVersions[]> {
    return db.projectFile.findMany({
      where: {
        projectId,
        type: options?.type,
        path: options?.path ? { startsWith: options.path } : undefined,
        tags: options?.tags ? { hasSome: options.tags } : undefined,
      },
      include: {
        _count: {
          select: {
            versions: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Update file
   */
  static async update(
    id: string,
    input: UpdateFileInput
  ): Promise<ProjectFile> {
    return db.projectFile.update({
      where: { id },
      data: input as any,
    })
  }

  /**
   * Delete file
   */
  static async delete(id: string): Promise<ProjectFile> {
    return db.projectFile.delete({
      where: { id },
    })
  }

  /**
   * Search files
   */
  static async search(
    projectId: string,
    query: string,
    options?: {
      type?: FileType
      tags?: string[]
    }
  ): Promise<ProjectFile[]> {
    return db.projectFile.findMany({
      where: {
        projectId,
        type: options?.type,
        tags: options?.tags ? { hasSome: options.tags } : undefined,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { path: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Get file versions
   */
  static async getVersions(fileId: string): Promise<ProjectFile[]> {
    return db.projectFile.findMany({
      where: {
        OR: [{ id: fileId }, { parentId: fileId }],
      },
      orderBy: { version: "desc" },
    })
  }

  /**
   * Restore file to specific version.
   * Uses the source version's original storageId (R2 key).
   * Prefer restoreVersionWithKey() when you have copied the R2 object first.
   */
  static async restoreVersion(
    fileId: string,
    versionId: string,
    createdById?: string
  ): Promise<ProjectFile> {
    const version = await db.projectFile.findUnique({
      where: { id: versionId },
    })

    if (!version) {
      throw new Error("Version not found")
    }

    const current = await db.projectFile.findUnique({
      where: { id: fileId },
    })

    if (!current) {
      throw new Error("File not found")
    }

    return db.projectFile.create({
      data: {
        projectId: version.projectId,
        name: version.name,
        path: version.path,
        type: version.type,
        mimeType: version.mimeType,
        size: version.size,
        storageId: version.storageId,
        url: version.url,
        tags: version.tags,
        metadata: version.metadata as any,
        visibility: version.visibility,
        createdById: createdById,
        parentId: fileId,
        version: current.version + 1,
      },
    })
  }

  /**
   * Restore file to a specific version using a pre-copied R2 object key.
   * The caller is responsible for copying the R2 object before calling this.
   *
   * This overload exists so the restore route can supply a freshly-copied
   * storageKey rather than re-using the source version's key, keeping all
   * versions as independent objects in R2.
   */
  static async restoreVersionWithKey(
    fileId: string,
    versionId: string,
    newStorageKey: string,
    createdById?: string,
    url?: string
  ): Promise<ProjectFile> {
    const version = await db.projectFile.findUnique({
      where: { id: versionId },
    })

    if (!version) {
      throw new Error("Version not found")
    }

    const current = await db.projectFile.findUnique({
      where: { id: fileId },
    })

    if (!current) {
      throw new Error("File not found")
    }

    return db.projectFile.create({
      data: {
        projectId: version.projectId,
        name: version.name,
        path: version.path,
        type: version.type,
        mimeType: version.mimeType,
        size: version.size,
        storageId: newStorageKey,
        // Do not carry over the source version's stored url (it may be a dead
        // or private presigned URL). The caller can pass an explicit override;
        // otherwise the restored row starts with a null url.
        url: url ?? undefined,
        tags: version.tags,
        metadata: version.metadata as any,
        visibility: version.visibility,
        createdById: createdById,
        parentId: fileId,
        version: current.version + 1,
      },
    })
  }

  /**
   * Get file statistics for a project
   */
  static async getProjectStats(projectId: string) {
    const [total, byType, totalSize] = await Promise.all([
      db.projectFile.count({ where: { projectId } }),
      db.projectFile.groupBy({
        by: ["type"],
        where: { projectId },
        _count: true,
        _sum: { size: true },
      }),
      db.projectFile.aggregate({
        where: { projectId },
        _sum: { size: true },
      }),
    ])

    return {
      total,
      totalSize: totalSize._sum.size || 0,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = {
            count: item._count,
            size: item._sum.size || 0,
          }
          return acc
        },
        {} as Record<string, { count: number; size: number }>
      ),
    }
  }

  /**
   * Create file share
   */
  static async createShare(input: CreateFileShareInput): Promise<FileShare> {
    const token = crypto.randomUUID()

    return db.fileShare.create({
      data: {
        fileId: input.fileId,
        token,
        expiresAt: input.expiresAt,
        maxDownloads: input.maxDownloads,
        createdById: input.createdById,
      },
    })
  }

  /**
   * Get file share by token
   */
  static async getShareByToken(token: string): Promise<FileShare | null> {
    return db.fileShare.findUnique({
      where: { token },
      include: {
        file: true,
      },
    })
  }

  /**
   * Increment share download count
   */
  static async incrementShareDownload(shareId: string): Promise<FileShare> {
    return db.fileShare.update({
      where: { id: shareId },
      data: {
        downloads: { increment: 1 },
      },
    })
  }

  /**
   * Delete file share
   */
  static async deleteShare(shareId: string): Promise<FileShare> {
    return db.fileShare.delete({
      where: { id: shareId },
    })
  }

  /**
   * List file shares
   */
  static async listShares(fileId: string): Promise<FileShare[]> {
    return db.fileShare.findMany({
      where: { fileId },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Check if share is valid
   */
  static async isShareValid(share: FileShare): Promise<boolean> {
    // Check expiration
    if (share.expiresAt && share.expiresAt < new Date()) {
      return false
    }

    // Check max downloads
    if (share.maxDownloads && share.downloads >= share.maxDownloads) {
      return false
    }

    return true
  }
}
