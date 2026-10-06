export type SavedDesign = {
  id: string;
  image: string;
  prompt: string;
  colors: string[];
  createdAt: string;
};

const STORAGE_KEY = "mudmee-demo-designs-v1";

const sampleDesigns: SavedDesign[] = [
  {
    id: "sample-dok-single",
    image: "/output/pattern_tile.png",
    prompt: "ลายดอกเดี่ยว · ตัวอย่างลายผ้ามัดหมี่",
    colors: ["#7b2837", "#e6bd68", "#f4ead1"],
    createdAt: "2026-10-03T09:00:00.000Z",
  },
];

export function readDemoDesigns(): SavedDesign[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDesigns));
      return sampleDesigns;
    }
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return sampleDesigns;
    const designs = (parsed as SavedDesign[]).filter((design) => design.id !== "sample-dok-repeat");
    if (designs.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    return designs;
  } catch {
    return sampleDesigns;
  }
}

export function saveDemoDesign(input: Omit<SavedDesign, "id" | "createdAt">): void {
  const designs = readDemoDesigns();
  designs.unshift({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
}

export function deleteDemoDesign(id: string): SavedDesign[] {
  const designs = readDemoDesigns().filter((design) => design.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  return designs;
}
