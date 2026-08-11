export default function Background({ bgImage }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
      <img
        className="h-full w-full object-cover"
        src={bgImage || '/Background.png'}
        alt="Truck environment"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
    </div>
  );
}
