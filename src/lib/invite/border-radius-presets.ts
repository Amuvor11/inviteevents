export interface BorderRadiusPreset {
  value: number;
  label: string;
}

export const BORDER_RADIUS_PRESETS: BorderRadiusPreset[] = [
  { value: 0, label: "Прямі" },
  { value: 8, label: "Легке" },
  { value: 16, label: "Середнє" },
  { value: 24, label: "Сильне" },
  { value: 9999, label: "Коло" },
];
