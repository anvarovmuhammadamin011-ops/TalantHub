import { Package, MessageSquare, Eye, Clock, Star, CheckCircle, Briefcase, ShieldCheck, Bell } from "lucide-react";

export const notificationTypeIcons = {
  order: Package,
  message: MessageSquare,
  application: Eye,
  interview: Clock,
  rating: Star,
  vacancy: Briefcase,
  verification: ShieldCheck,
  info: CheckCircle,
};

export const notificationTypeColors = {
  order: "text-blue-600 bg-blue-50",
  message: "text-accent bg-accent-soft",
  application: "text-purple-600 bg-purple-50",
  interview: "text-[#B45309] bg-[#FEF3C7]",
  rating: "text-ink bg-surface",
  vacancy: "text-accent bg-accent-soft",
  verification: "text-success bg-success-soft",
  info: "text-ink-3 bg-surface",
};

export function getNotificationIcon(type) {
  return notificationTypeIcons[type] || Bell;
}

export function getNotificationColor(type) {
  return notificationTypeColors[type] || notificationTypeColors.info;
}
