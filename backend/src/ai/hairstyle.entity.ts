import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("ai_style_sessions")
export class AiStyleSession {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column() ownerEmail!: string;
  @Index() @Column() photoAssetId!: string;
  @Column({ default: false }) consentGiven!: boolean;
  @Column({ default: "uploaded" }) status!: string;
  @Column({ type: "jsonb", nullable: true }) profile!: Record<
    string,
    unknown
  > | null;
  @Column({ type: "jsonb", default: "{}" }) preferences!: Record<
    string,
    unknown
  >;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity("ai_style_recommendations")
export class AiStyleRecommendation {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column() sessionId!: string;
  @Column() styleId!: string;
  @Column() name!: string;
  @Column({ type: "text" }) description!: string;
  @Column({ type: "text" }) reason!: string;
  @Column({ default: "medium" }) maintenance!: string;
  @Column({ default: "Haircut" }) serviceCategory!: string;
  @Column({ type: "int" }) rank!: number;
  @Column({ type: "jsonb", default: "[]" }) matchReasons!: string[];
  @CreateDateColumn() createdAt!: Date;
}

@Entity("ai_generation_jobs")
export class AiGenerationJob {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column() ownerEmail!: string;
  @Index() @Column() sessionId!: string;
  @Column() recommendationId!: string;
  @Index({ unique: true }) @Column() idempotencyKey!: string;
  @Column({ default: "queued" }) status!: string;
  @Column({ type: "varchar", nullable: true }) provider!: string | null;
  @Column({ type: "varchar", nullable: true }) model!: string | null;
  @Column({ type: "varchar", nullable: true }) outputAssetId!: string | null;
  @Column({ type: "text", nullable: true }) errorMessage!: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity("ai_usage_logs")
export class AiUsageLog {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column() ownerEmail!: string;
  @Column({ type: "varchar", nullable: true }) sessionId!: string | null;
  @Column() action!: string;
  @Column({ type: "varchar", nullable: true }) provider!: string | null;
  @Column({ type: "varchar", nullable: true }) model!: string | null;
  @Column({ default: false }) success!: boolean;
  @Column({ type: "text", nullable: true }) errorMessage!: string | null;
  @CreateDateColumn() createdAt!: Date;
}
