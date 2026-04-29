import { Schema, model, models, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lastImportAt: {
      type: Date,
    },
    lastImportScoreCount: {
      type: Number,
      default: 0,
    },
    lastImportFailedScoreCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export type Session = InferSchemaType<typeof sessionSchema>;

export const SessionModel = models.Session || model("Session", sessionSchema);
