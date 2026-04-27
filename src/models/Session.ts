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
  },
  {
    timestamps: true,
  },
);

export type Session = InferSchemaType<typeof sessionSchema>;

export const SessionModel = models.Session || model("Session", sessionSchema);
