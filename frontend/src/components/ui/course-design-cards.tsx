"use client";

import React from "react";
import { MoreVertical, Plus } from "lucide-react";

// Define the type for the card data
export interface CourseCardData {
  id: number;
  colorClass: "green" | "orange" | "red" | "blue";
  date: string;
  title: string;
  description: string;
  progressPercent: string;
  progressValue: string;
  imgSrc1?: string;
  imgAlt1?: string;
  imgSrc2?: string;
  imgAlt2?: string;
  countdownText: string;
}

// Define the props for the Card component
interface CardProps {
  data: CourseCardData;
}

const colorMap = {
  green: {
    accent: "var(--clr-green)",
    glow: "rgba(1, 195, 168, 0.15)",
    border: "rgba(1, 195, 168, 0.25)",
  },
  orange: {
    accent: "var(--clr-orange)",
    glow: "rgba(255, 183, 65, 0.15)",
    border: "rgba(255, 183, 65, 0.25)",
  },
  red: {
    accent: "var(--clr-red)",
    glow: "rgba(166, 61, 42, 0.15)",
    border: "rgba(166, 61, 42, 0.25)",
  },
  blue: {
    accent: "var(--clr-blue)",
    glow: "rgba(24, 144, 255, 0.15)",
    border: "rgba(24, 144, 255, 0.25)",
  },
};

const Card: React.FC<CardProps> = ({ data }) => {
  const {
    colorClass,
    date,
    title,
    description,
    progressPercent,
    progressValue,
    imgSrc1,
    imgAlt1,
    imgSrc2,
    imgAlt2,
    countdownText,
  } = data;

  const colors = colorMap[colorClass];
  const percent = parseInt(progressPercent, 10);

  return (
    <div
      className="group relative flex w-72 flex-col rounded-2xl border border-[var(--color-gray-medium)] bg-[var(--bg-dark)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        boxShadow: `0 0 0 0 transparent`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px ${colors.glow}`;
        (e.currentTarget as HTMLDivElement).style.borderColor = colors.border;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 transparent`;
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-gray-medium)";
      }}
    >
      {/* Colored top-edge accent bar */}
      <div
        className="absolute left-0 top-0 h-[3px] w-full rounded-t-2xl"
        style={{ background: colors.accent }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[var(--color-gray-light)] opacity-60">
          {date}
        </span>
        <button className="rounded-full p-1 text-[var(--color-gray-light)] opacity-40 transition-opacity hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-lg font-semibold capitalize text-[var(--color-white)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-gray-light)] opacity-60">
          {description}
        </p>

        {/* Progress */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--color-gray-light)] opacity-60">
              Progress
            </span>
            <span className="font-mono font-semibold" style={{ color: colors.accent }}>
              {progressValue}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-gray-dark)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}dd)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-gray-dark)] pt-4">
        <div className="flex -space-x-2">
          {imgSrc1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc1}
              alt={imgAlt1 || "user avatar"}
              className="h-8 w-8 rounded-full border-2 border-[var(--bg-dark)] object-cover"
            />
          )}
          {imgSrc2 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc2}
              alt={imgAlt2 || "user avatar"}
              className="h-8 w-8 rounded-full border-2 border-[var(--bg-dark)] object-cover"
            />
          )}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-gray-medium)] bg-[var(--bg-dark)] text-[var(--color-gray-light)] opacity-50 transition-all hover:border-solid hover:opacity-100"
            style={{
              ["--tw-border-opacity" as string]: 1,
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            background: colors.glow,
            color: colors.accent,
          }}
        >
          {countdownText}
        </span>
      </div>
    </div>
  );
};

export default Card;
