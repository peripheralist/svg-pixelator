import Head from "next/head";
import _Image from "next/image";
import { useCallback, useRef, useState } from "react";

// const pixelSize = 2;
// const SRC_SIZE = 1200;

export default function Home() {
  const [imgSource, setImgSource] = useState<string>();
  const [svgString, setSvgString] = useState<string>();
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const [pixelSize, setPixelSize] = useState<number>(2);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawImageAndReadPixel = useCallback(async () => {
    const ctx = canvasRef.current?.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx || !imgRef.current || !width || !height) return;

    // const { width, height } = analysisImgRef.current;

    // console.log({ width, height });

    function fillForPixel({ x, y }: { x: number; y: number }) {
      if (!ctx) return;

      // Get the image data for a single pixel
      const imgData = ctx.getImageData(x, y, pixelSize, pixelSize).data;

      // imgData is an RGBA array, so it contains four values
      const red = imgData[0];
      const green = imgData[1];
      const blue = imgData[2];
      const alpha = imgData[3]; // Transparency (0-255)

      return `rgba(${red},${green},${blue},${alpha})`;
    }

    // Draw the image onto the canvas
    ctx.drawImage(imgRef.current, 0, 0);

    let _svgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        const _x = x;
        let w = pixelSize;
        const fill = fillForPixel({ x, y });

        while (w + _x < width && fillForPixel({ x: x + 1, y }) === fill) {
          w += pixelSize;
          x += pixelSize;
        }

        _svgString += `<rect width="${w}" height="${pixelSize}" x="${_x}" y="${y}" fill="${fill}" />`;
      }
    }

    _svgString += `</svg>`;

    console.log(_svgString);

    setSvgString(_svgString);
  }, [width, height, pixelSize]);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <label htmlFor="">Pixel size</label>
              <input
                type="number"
                onChange={(e) => setPixelSize(parseInt(e.target.value || "0"))}
                value={pixelSize}
              />
            </div>

            {imgSource && (
              <div>
                <div>Width: {width}px</div>
                <div>Height: {height}px</div>
              </div>
            )}

            {imgSource ? (
              <_Image
                ref={imgRef}
                src={imgSource}
                alt="sup"
                width={200}
                height={200}
              />
            ) : (
              <input
                type="file"
                name=""
                id=""
                onChange={(e) => {
                  var reader = new FileReader();

                  reader.onload = function (_e: ProgressEvent<FileReader>) {
                    const src = _e.target?.result as string;
                    setImgSource(src);

                    const img = new Image();
                    img.onload = () => {
                      setWidth(img.width);
                      setHeight(img.height);
                    };
                    img.src = src;
                  };

                  const file = e.target.files?.[0];
                  if (!file) return;

                  reader.readAsDataURL(file);
                }}
              />
            )}

            <div>
              {svgString ? (
                <_Image
                  src={`data:image/svg+xml;base64,${btoa(svgString)}`}
                  alt="svg"
                  width={200}
                  height={200}
                />
              ) : (
                <button onClick={drawImageAndReadPixel}>Generate SVG</button>
              )}
            </div>
          </div>

          <canvas
            style={{ visibility: "hidden", position: "absolute" }}
            ref={canvasRef}
            id="myCanvas"
            width={width}
            height={height}
          />
          {/* {svgString && <div dangerouslySetInnerHTML={{ __html: svgString }} />} */}
        </div>
      </main>
    </>
  );
}
