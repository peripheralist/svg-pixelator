import Head from "next/head";
import _Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

type Region = {
  fill: string;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
};

export default function Home() {
  const [imgSource, setImgSource] = useState<string>();
  const [svgString, setSvgString] = useState<string>();
  const [srcWidth, setSrcWidth] = useState<number>();
  const [srcHeight, setSrcHeight] = useState<number>();
  const [pixelSize, setPixelSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>();

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { svgWidth, svgHeight } = useMemo(
    () => ({
      svgWidth: srcWidth ? srcWidth / pixelSize : 0,
      svgHeight: srcHeight ? srcHeight / pixelSize : 0,
    }),
    [srcWidth, srcHeight, pixelSize]
  );

  const drawImageAndReadPixel = useCallback(async () => {
    const ctx = canvasRef.current?.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx || !imgRef.current || !srcWidth || !srcHeight) return;

    function fillForPixel({ x, y }: { x: number; y: number }) {
      // Get the image data for a single pixel
      const imgData = ctx!.getImageData(
        x * pixelSize,
        y * pixelSize,
        pixelSize,
        pixelSize
      ).data;

      // imgData is an RGBA array, so it contains four values
      const red = imgData[0];
      const green = imgData[1];
      const blue = imgData[2];
      const alpha = imgData[3]; // Transparency (0-255)

      return alpha === 0
        ? "transparent"
        : `#${red.toString(16).padStart(2, "0")}${green
            .toString(16)
            .padStart(2, "0")}${blue.toString(16).padStart(2, "0")}${
            alpha < 255 ? alpha.toString(16) : ""
          }`;
    }

    function regionId({ x, y }: { x: number; y: number }) {
      return `${x}-${y}`;
    }

    // Draw the image onto the canvas
    ctx.drawImage(imgRef.current, 0, 0);

    const regions: Region[] = [];
    const regionIdxs: Record<string, number> = {};

    for (let y = 0; y < srcHeight; y += 1) {
      for (let x = 0; x < srcWidth; x += 1) {
        const xOrigin = x;
        const fill = fillForPixel({ x, y });
        let regionWidth = 1;

        while (
          regionWidth + xOrigin < srcWidth &&
          fillForPixel({ x: x + 1, y }) === fill
        ) {
          x++;
          regionWidth++;
        }

        const aboveRegionIdx = regionIdxs[regionId({ x: xOrigin, y: y - 1 })];

        const aboveRegion = aboveRegionIdx
          ? regions[aboveRegionIdx]
          : undefined;

        const id = regionId({ x: xOrigin, y });

        if (
          aboveRegion &&
          aboveRegion.fill === fill &&
          aboveRegion.size.width === regionWidth
        ) {
          // add row height to above region
          regions[aboveRegionIdx].size.height += 1;
          // record idx
          regionIdxs[id] = aboveRegionIdx;
          continue;
        }

        // create new region
        regions.push({
          fill,
          size: { width: regionWidth, height: 1 },
          position: { x: xOrigin, y },
        });
        // record idx
        regionIdxs[id] = regions.length - 1;
      }
    }

    const rects = regions.map(
      ({ fill, size, position }) =>
        `<rect width="${size.width}" height="${size.height}" x="${position.x}" y="${position.y}" fill="${fill}" />`
    );

    const _svgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${svgWidth} ${svgHeight}">${rects.join(
      ""
    )}</svg>`;

    setSvgString(_svgString);
    ctx.reset();
    setLoading(false);
  }, [srcWidth, srcHeight, svgWidth, svgHeight, pixelSize]);

  const elemSize = 480;

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        style={{ maxHeight: "100vh", maxWidth: "100vw", overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 20,
            gap: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              Original
              <div
                style={{
                  position: "relative",
                  width: elemSize,
                  height: elemSize,
                  background: "white",
                }}
              >
                {imgSource && (
                  <_Image ref={imgRef} src={imgSource} alt="sup" fill />
                )}
              </div>
              <input
                type="file"
                onChange={(e) => {
                  var reader = new FileReader();

                  reader.onload = function (_e: ProgressEvent<FileReader>) {
                    const src = _e.target?.result as string;
                    setImgSource(src);

                    const img = new Image();
                    img.onload = () => {
                      setSrcWidth(img.width);
                      setSrcHeight(img.height);
                    };
                    img.src = src;
                  };

                  const file = e.target.files?.[0];
                  if (!file) return;

                  reader.readAsDataURL(file);
                }}
              />
              {srcWidth && srcHeight && (
                <div>
                  {srcWidth ?? "--"}x{srcHeight ?? "--"} px
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              SVG
              <div
                style={{
                  position: "relative",
                  width: elemSize,
                  height: elemSize,
                  background: "white",
                }}
              >
                {svgString && (
                  <_Image
                    src={`data:image/svg+xml;base64,${btoa(svgString)}`}
                    alt="svg"
                    fill
                  />
                )}
              </div>
              <form
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                }}
                onSubmit={(e) => {
                  e.preventDefault(); // prevent page reload
                  setLoading(true);
                  setTimeout(() => {
                    drawImageAndReadPixel();
                  }, 0);
                }}
              >
                <label htmlFor="">Pixel size</label>

                <input
                  type="number"
                  onChange={(e) =>
                    setPixelSize(parseInt(e.target.value || "0"))
                  }
                  value={pixelSize}
                />

                <button disabled={loading} type="submit">
                  {loading ? "Generating..." : "Generate SVG"}
                </button>
              </form>
              <div>
                Output size:{" "}
                {svgString?.length
                  ? (svgString.length / 1000).toFixed(1)
                  : "--"}
                kB
              </div>
            </div>
          </div>
        </div>

        {/* {svgString && (
            <div
              style={{ width: 200, height: 200 }}
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          )} */}

        <div style={{ height: 0, overflow: "hidden" }}>
          <canvas
            style={{
              visibility: "hidden",
            }}
            ref={canvasRef}
            id="myCanvas"
            width={srcWidth}
            height={srcHeight}
          />
        </div>
      </main>
    </>
  );
}
