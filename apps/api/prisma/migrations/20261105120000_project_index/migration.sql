-- CreateTable
CREATE TABLE "ProjectIndex" (
    "id" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "readmeSummary" TEXT,
    "commits" JSONB NOT NULL,
    "endpoints" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectIndex_pkey" PRIMARY KEY ("id")
);
