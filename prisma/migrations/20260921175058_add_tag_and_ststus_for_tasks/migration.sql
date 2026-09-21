-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('created', 'in_progress', 'done', 'cancelled');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'created',
ADD COLUMN     "tag" TEXT[] DEFAULT ARRAY[]::TEXT[];
