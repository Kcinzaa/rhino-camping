export default function FloatingDecoration() {
  return (
    <>
      <div className="pointer-events-none absolute left-6 top-24 hidden h-28 w-28 rounded-full bg-[#e97732]/20 blur-3xl md:block" />
      <div className="pointer-events-none absolute bottom-16 right-10 hidden h-36 w-36 rounded-full bg-[#1f3d2b]/20 blur-3xl md:block" />
      <div className="pointer-events-none absolute right-[18%] top-[20%] hidden h-5 w-5 rounded-full bg-[#e97732] md:block" />
      <div className="pointer-events-none absolute left-[12%] bottom-[25%] hidden h-3 w-3 rounded-full bg-white md:block" />
    </>
  );
}