"use client";
import { useEffect, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import SourceImage from "./SourceImage";
import { scanImages, type ScanImage } from "../config/imaging";
export default function ScanComparisons({ condition }: { condition: string }) {
  const [example, setExample] = useState("brain"),
    [zoom, setZoom] = useState<ScanImage | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (/pneumonia/i.test(condition)) setExample("chest");
    else if (/stroke|cerebral infarction/i.test(condition)) setExample("brain");
  }, [condition]);
  useEffect(() => {
    if (zoom && !dialog.current?.open) dialog.current?.showModal();
  }, [zoom]);
  function credit(image: ScanImage) {
    return (
      <div className="image-credit">
        <a href={image.source} target="_blank" rel="noreferrer">
          {image.author} · Original image
        </a>
        <a href={image.licenseUrl} target="_blank" rel="noreferrer">
          {image.license} · Unmodified
        </a>
      </div>
    );
  }
  function figure(image: ScanImage, label: string) {
    return (
      <figure key={image.asset}>
        <div className="image-label">{label}</div>
        <button
          className="scan-enlarge"
          onClick={() => setZoom(image)}
          aria-label={"Enlarge " + image.title}
        >
          <SourceImage asset={image.asset} alt={image.alt} />
          <span>
            <ZoomIn size={16} /> Enlarge image
          </span>
        </button>
        <figcaption>
          <h4>{image.title}</h4>
          <p>{image.caption}</p>
          {credit(image)}
        </figcaption>
      </figure>
    );
  }
  return (
    <div className="scan-comparisons">
      <div className="comparison-heading">
        <div>
          <span className="eyebrow">REAL CLINICAL IMAGES</span>
          <h3>Explore the differences.</h3>
        </div>
        <div
          className="example-tabs"
          role="group"
          aria-label="Scan comparison examples"
        >
          <button
            onClick={() => setExample("brain")}
            aria-pressed={example === "brain"}
          >
            Brain CT
          </button>
          <button
            onClick={() => setExample("chest")}
            aria-pressed={example === "chest"}
          >
            Chest X-ray
          </button>
        </div>
      </div>
      <p className="comparison-intro">
        Actual published scans, with original sources. Tap an image to see it
        larger.
      </p>
      {example === "brain" ? (
        <div className="scan-pair">
          {figure(scanImages.normal, "NORMAL ANATOMY EXAMPLE")}
          {figure(scanImages.infarct, "DISEASE-ASSOCIATED EXAMPLE")}
        </div>
      ) : (
        <div className="scan-pair single">
          {figure(
            scanImages.chest,
            "NORMAL & PNEUMONIA · SOURCE-LABELED CASES",
          )}
        </div>
      )}
      <p className="scan-context">
        Separate patients and examinations, with different slice levels and
        techniques. These educational examples cannot confirm or exclude a
        diagnosis.
      </p>
      <div className="comparison-links">
        <a
          href={
            example === "brain"
              ? "https://www.radiologyinfo.org/en/info/stroke"
              : "https://www.radiologyinfo.org/en/info/pneumonia"
          }
          target="_blank"
          rel="noreferrer"
        >
          Read the clinical imaging context
        </a>
        {condition && (
          <span>
            Two curated examples are available; this is not an image atlas for
            every condition.
          </span>
        )}
      </div>
      <dialog
        ref={dialog}
        className="scan-dialog"
        onClose={() => setZoom(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        {zoom && (
          <>
            <div className="zoom-heading">
              <strong>{zoom.title}</strong>
              <button
                aria-label="Close enlarged scan"
                onClick={() => dialog.current?.close()}
                autoFocus
              >
                <X size={22} />
              </button>
            </div>
            <img src={zoom.file} alt={zoom.alt} />
            <p>{zoom.caption}</p>
            {credit(zoom)}
          </>
        )}
      </dialog>
    </div>
  );
}
