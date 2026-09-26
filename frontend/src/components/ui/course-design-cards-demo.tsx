"use client";

import React from "react";
import Card, { type CourseCardData } from "@/components/ui/course-design-cards";

const cardData: CourseCardData[] = [
  {
    id: 1,
    colorClass: "green",
    date: "Feb 2, 2021",
    title: "web designing",
    description: "Prototyping",
    progressPercent: "90%",
    progressValue: "90%",
    imgSrc1:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    imgAlt1: "User 1",
    imgSrc2:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    imgAlt2: "User 2",
    countdownText: "2 days left",
  },
  {
    id: 2,
    colorClass: "orange",
    date: "Feb 05, 2021",
    title: "mobile app",
    description: "Shopping",
    progressPercent: "30%",
    progressValue: "30%",
    imgSrc1:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    imgAlt1: "User 3",
    imgSrc2:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    imgAlt2: "User 4",
    countdownText: "3 weeks left",
  },
  {
    id: 3,
    colorClass: "red",
    date: "March 03, 2021",
    title: "dashboard",
    description: "Medical",
    progressPercent: "50%",
    progressValue: "50%",
    imgSrc1:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    imgAlt1: "User 5",
    imgSrc2:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
    imgAlt2: "User 6",
    countdownText: "3 weeks left",
  },
  {
    id: 4,
    colorClass: "blue",
    date: "March 08, 2021",
    title: "web designing",
    description: "Wireframing",
    progressPercent: "20%",
    progressValue: "20%",
    imgSrc1:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    imgAlt1: "Erik Longman",
    imgSrc2:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    imgAlt2: "Jane Doe",
    countdownText: "3 weeks left",
  },
];

export default function CourseDesignCardsDemo() {
  return (
    <section className="flex flex-wrap items-start justify-center gap-6 p-8">
      {cardData.map((card) => (
        <Card key={card.id} data={card} />
      ))}
    </section>
  );
}
