import type { ComponentType } from "react";
import { RomanticLayout } from "./romantic-layout";
import { ElegantLayout } from "./elegant-layout";
import { ClassicLayout } from "./classic-layout";
import type { InviteLayoutProps } from "./types";

const LAYOUT_MAP: Record<string, ComponentType<InviteLayoutProps>> = {
  romantic: RomanticLayout,
  elegant: ElegantLayout,
  classic: ClassicLayout,
  minimal: ClassicLayout,
  modern: ElegantLayout,
  kids: ClassicLayout,
};

export function InviteLayoutRenderer(props: InviteLayoutProps) {
  const layout = props.event.template?.layout ?? "classic";
  const Component = LAYOUT_MAP[layout] ?? ClassicLayout;
  return <Component {...props} />;
}

export { RomanticLayout, ElegantLayout, ClassicLayout };
