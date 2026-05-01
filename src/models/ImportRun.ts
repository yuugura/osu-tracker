import { Schema, model, models, type InferSchemaType } from "mongoose";

const importRunSchema = new Schema(
  {
    trigger: {
      type: String,
      enum: ["dashboard-auto", "manual", "scheduler"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["running", "success", "partial", "failed"],
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    finishedAt: {
      type: Date,
    },
    userCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    importedPlayCount: {
      type: Number,
      default: 0,
    },
    recentScoreCount: {
      type: Number,
      default: 0,
    },
    failures: {
      type: [
        {
          error: {
            type: String,
          },
          userId: {
            type: String,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

importRunSchema.index({ trigger: 1, startedAt: -1 });

export type ImportRun = InferSchemaType<typeof importRunSchema>;

export const ImportRunModel =
  models.ImportRun || model("ImportRun", importRunSchema);
