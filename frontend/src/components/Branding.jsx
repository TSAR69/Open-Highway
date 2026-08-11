export default function Branding() {
  return (
    <div className="flex flex-col items-center justify-center pointer-events-none select-none">
      <img
        src="/font.svg"
        alt="रास्ता"
        className="h-16 md:h-24 lg:h-32 w-auto object-contain drop-shadow-2xl"
        draggable={false}
      />
    </div>
  );
}
