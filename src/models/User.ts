import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    osuUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    tokenExpiresAt: {
      type: Date,
    },
    aiSummariesEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);
