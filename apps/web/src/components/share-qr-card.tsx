"use client";

import { useRef, useState } from "react";

import type { Route } from "next";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Check, Copy, Download, ExternalLink, Printer } from "lucide-react";

import { Badge, Button, Card, Input } from "@/components/ui";
import type { ShareDestination } from "@/lib/share-kit";

export function ShareQrCard({
  destination,
  venueSlug,
}: {
  destination: ShareDestination;
  venueSlug: string;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(destination.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function downloadSvg() {
    const svg = getQrSvg(qrRef.current);

    if (!svg) {
      return;
    }

    const source = serializeSvg(svg);
    downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), `${destination.fileName}.svg`);
  }

  async function downloadPng() {
    const svg = getQrSvg(qrRef.current);

    if (!svg) {
      return;
    }

    const source = serializeSvg(svg);
    const imageUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));

    try {
      const image = await loadImage(imageUrl);
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${destination.fileName}.png`);
        }
      }, "image/png");
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  return (
    <Card className="overflow-hidden border-border/80 bg-white/92 shadow-[0_18px_48px_rgba(80,54,31,0.06)]" style={{ padding: 0 }}>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <div className="min-w-0 px-5 py-5 md:px-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={destination.kind === "event" ? "info" : "accent"}>{destination.subtitle}</Badge>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{destination.label}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{destination.description}</p>

          <div className="mt-5 flex flex-col gap-2">
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Public URL
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input className="font-mono text-[12px]" readOnly value={destination.url} />
              <Button className="shrink-0" onClick={copyUrl} size="sm" type="button" variant="secondary">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href={destination.path as Route} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open preview
              </Link>
            </Button>
            <Button onClick={downloadPng} size="sm" type="button" variant="secondary">
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button onClick={downloadSvg} size="sm" type="button" variant="secondary">
              <Download className="h-4 w-4" />
              Download SVG
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/app/${venueSlug}/share/print/${destination.printKey}?layout=tent` as Route} target="_blank">
                <Printer className="h-4 w-4" />
                Table tent
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/app/${venueSlug}/share/print/${destination.printKey}?layout=poster` as Route} target="_blank">
                <Printer className="h-4 w-4" />
                Poster
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-border/70 bg-[linear-gradient(180deg,#fff,#f8f4ee)] p-6 lg:border-l lg:border-t-0">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm" ref={qrRef}>
            <QRCode
              bgColor="#ffffff"
              fgColor="#000000"
              level="Q"
              size={168}
              title={`${destination.label} QR code`}
              value={destination.url}
              viewBox="0 0 168 168"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function getQrSvg(container: HTMLDivElement | null) {
  return container?.querySelector("svg") ?? null;
}

function serializeSvg(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  if (!clone.getAttribute("width")) {
    clone.setAttribute("width", "1024");
  }

  if (!clone.getAttribute("height")) {
    clone.setAttribute("height", "1024");
  }

  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
