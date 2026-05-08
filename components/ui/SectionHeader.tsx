type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl text-left"
      }
    >
      {eyebrow && (
        <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#e97732]">
          {eyebrow}
        </p>
      )}

      <h2 className="text-3xl font-black tracking-tight text-[#1f3d2b] md:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-base font-medium leading-8 text-slate-600 md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}