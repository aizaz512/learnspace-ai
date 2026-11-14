
import type { LucideIcon } from "lucide-react";

export interface Subject {
  id: number;
  semesterId: number;
  name: string;
  description: string;
  progress: number;
  chapters: number;
  completed: number;
  icon: LucideIcon;
  color: string;
  background: string;
}
