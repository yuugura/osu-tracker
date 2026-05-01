import { Schema, model, models, type InferSchemaType } from "mongoose";

const playSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    osuScoreId: {
      type: String,
      index: true,
    },
    osuScoreUrl: {
      type: String,
    },
    beatmapId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      trim: true,
    },
    score: {
      type: Number,
    },
    pp: {
      type: Number,
    },
    beatmapLength: {
      type: Number,
    },
    passed: {
      type: Boolean,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
    },
    rank: {
      type: String,
      trim: true,
    },
    mods: {
      type: [String],
      default: [],
    },
    playedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

playSchema.index({ sessionId: 1, playedAt: -1 });
playSchema.index({ userId: 1, sessionId: 1, osuScoreId: 1 }, { unique: true });

export type Play = InferSchemaType<typeof playSchema>;

export const PlayModel = models.Play || model("Play", playSchema);
