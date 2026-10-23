import "@/styles/wearo-shape-mosaic.scss";

const mosaicTiles = [
  { shape: "shape-02.svg", ink: "warm-cream-F2CEAE", paper: "blue" },
  { shape: "shape-04.svg", ink: "soft-coral-F2AD94", paper: "cream" },
  { shape: "shape-03.svg", ink: "blue-gray-7794A6", paper: "coral" },
  { shape: "shape-06.svg", ink: "soft-coral-F2AD94", paper: "paper" },
  { shape: "shape-01.svg", ink: "warm-cream-F2CEAE", paper: "coral" },
  { shape: "shape-07.svg", ink: "blue-gray-7794A6", paper: "cream" },
  { shape: "shape-08.svg", ink: "warm-cream-F2CEAE", paper: "blue" },
  { shape: "shape-05.svg", ink: "soft-coral-F2AD94", paper: "paper" },
  { shape: "shape-09.svg", ink: "blue-gray-7794A6", paper: "coral" },
] as const;

type ShapeMosaicProps = {
  className?: string;
};

export function ShapeMosaic({ className = "" }: ShapeMosaicProps) {
  return (
    <span aria-hidden="true" className={`wearo-shape-mosaic ${className}`.trim()}>
      {mosaicTiles.map((tile) => (
        <span key={tile.shape} className={`wearo-shape-mosaic__tile is-${tile.paper}`}>
          <img
            src={`/images/shapes-gallery/${tile.ink}/${tile.shape}`}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </span>
      ))}
    </span>
  );
}
