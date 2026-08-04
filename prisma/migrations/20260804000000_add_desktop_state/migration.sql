-- CreateTable
CREATE TABLE "desktop_state" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "windows" JSONB NOT NULL DEFAULT '[]',
    "desktop" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desktop_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desktop_state_project_id_user_id_name_key" ON "desktop_state"("project_id", "user_id", "name");

-- CreateIndex
CREATE INDEX "desktop_state_project_id_idx" ON "desktop_state"("project_id");

-- AddForeignKey
ALTER TABLE "desktop_state" ADD CONSTRAINT "desktop_state_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desktop_state" ADD CONSTRAINT "desktop_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
