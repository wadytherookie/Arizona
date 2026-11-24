"use client";
import { useState } from "react";
import ScanComparisons from "./ScanComparisons";
import SourceImage from "./SourceImage";
const extraModalities = [
  {
    name: "Mammography",
    full: "Breast X-ray imaging",
    text: "Dedicated breast X-rays can find changes that may need further evaluation. An abnormal result does not itself diagnose cancer.",
    uses: "Breast screening · breast symptoms",
    radiation: "Uses low-dose ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/mammo",
  },
  {
    name: "Fluoroscopy",
    full: "Real-time X-ray imaging",
    text: "Moving X-ray images help evaluate motion or guide procedures. Contrast may be used to make structures more visible.",
    uses: "Swallowing · gastrointestinal studies · procedures",
    radiation: "Uses ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/uppergi",
  },
  {
    name: "SPECT",
    full: "Single-photon emission computed tomography",
    text: "A gamma camera detects a radiotracer to build three-dimensional functional images, sometimes combined with CT.",
    uses: "Selected heart · bone · brain studies",
    radiation: "Uses a radioactive tracer",
    url: "https://www.radiologyinfo.org/en/info/gennuclear",
  },
  {
    name: "Angiography",
    full: "Blood-vessel imaging",
    text: "Vessels can be examined with catheter X-ray angiography, CT angiography or MR angiography. The technique determines radiation and contrast considerations.",
    uses: "Arteries · veins · vascular procedures",
    radiation: "Depends on the imaging technique",
    url: "https://www.radiologyinfo.org/en/info/angiocath",
  },
];
const modalities = [
  {
    name: "CT",
    full: "Computed tomography",
    text: "Cross-sectional X-ray images show organs, bones, bleeding and some lung changes. Contrast may help distinguish tissues.",
    uses: "Lungs · trauma · abdomen · blood vessels",
    radiation: "Uses ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/bodyct",
  },
  {
    name: "MRI",
    full: "Magnetic resonance imaging",
    text: "Magnetic fields and radio waves create detailed soft-tissue images. Different sequences reveal different tissue properties.",
    uses: "Brain · spine · joints · soft tissues",
    radiation: "No ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/bodymr",
  },
  {
    name: "X-ray",
    full: "Radiography",
    text: "A projection image is useful for bones and many chest questions. Structures overlap, so subtle changes may be hidden.",
    uses: "Bones · chest · dental imaging",
    radiation: "Uses ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/chestrad",
  },
  {
    name: "Ultrasound",
    full: "Sonography",
    text: "Sound waves produce real-time images. Doppler assesses blood flow; image quality depends on the body region and examination.",
    uses: "Pregnancy · abdomen · heart · blood flow",
    radiation: "No ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/genus",
  },
  {
    name: "PET",
    full: "Positron emission tomography",
    text: "A radiotracer shows patterns of biological activity. Often combined with CT; increased uptake is not specific to cancer.",
    uses: "Selected cancers · brain · heart",
    radiation: "Uses a radioactive tracer",
    url: "https://www.radiologyinfo.org/en/info/pet",
  },
  {
    name: "DEXA",
    full: "Bone densitometry",
    text: "Low-dose X-rays measure bone mineral density. Results help assess bone health in clinical context.",
    uses: "Bone density · osteoporosis assessment",
    radiation: "Uses low-dose ionizing radiation",
    url: "https://www.radiologyinfo.org/en/info/dexa",
  },
  ...extraModalities,
];
export default function Imaging({ condition }: { condition: string }) {
  const [active, setActive] = useState("CT");
  const m = modalities.find((x) => x.name === active)!;
  return (
    <section id="imaging" className="section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE IMAGING LIBRARY</span>
          <h2>Real scans. A clearer picture.</h2>
        </div>
        <span className="section-caption">
          Understand the scan before the image.
        </span>
      </div>
      <ScanComparisons condition={condition} />
      <div className="modality-heading">
        <span className="eyebrow">EXPLORE THE TECHNIQUES</span>
        <h3>Ten ways to look inside the body.</h3>
      </div>
      <div className="imaging-layout">
        <div className="scan-menu">
          {modalities.map((x) => (
            <button
              key={x.name}
              onClick={() => setActive(x.name)}
              aria-pressed={active === x.name}
              className={active === x.name ? "selected" : ""}
            >
              <strong>{x.name}</strong>
              <span>{x.full}</span>
            </button>
          ))}
        </div>
        <div className="scan-detail">
          <div className="scan-preview">
            {active === "CT" ? (
              <SourceImage
                asset="normal-brain"
                alt="Real non-contrast CT example of normal brain anatomy"
              />
            ) : active === "X-ray" ? (
              <SourceImage
                asset="chest-comparison"
                alt="Real chest X-ray examples published as normal and pneumonia"
              />
            ) : (
              <div className="technique-tile">
                <strong>{active}</strong>
                <span>Technique guide</span>
                <p>{m.radiation}</p>
              </div>
            )}
            <small>
              {active === "CT" || active === "X-ray"
                ? "Real clinical image · sources and credits in the comparison gallery above."
                : "Explore the linked radiology guide for clinical examples."}
            </small>
          </div>
          <div>
            <span className="eyebrow">{m.radiation}</span>
            <h3>{m.full}</h3>
            <p>{m.text}</p>
            <p className="muted">Common applications: {m.uses}</p>
            <a href={m.url} target="_blank" rel="noreferrer">
              Read the RadiologyInfo guide
            </a>
          </div>
        </div>
      </div>
      <div className="comparison">
        <div>
          <span className="eyebrow">NORMAL & DISEASE-ASSOCIATED FINDINGS</span>
          <h3>
            {condition ? `Imaging and ${condition}` : "What changes on a scan?"}
          </h3>
          <p>
            There is no single scan appearance shared by everyone with a
            disease. Findings vary with stage, technique and treatment; a normal
            scan may not exclude disease.
          </p>
        </div>
        <div>
          <p>
            Explore published images with their clinical context and original
            captions.
          </p>
          <a
            className="button secondary"
            target="_blank"
            rel="noreferrer"
            href={
              "https://pmc.ncbi.nlm.nih.gov/?term=" +
              encodeURIComponent(
                (condition || "normal abnormal") +
                  " " +
                  active +
                  " imaging comparison",
              )
            }
          >
            Find published {active} examples
          </a>
          <small>
            External literature search · Images are not automatically verified
            comparisons. No patient uploads or diagnostic interpretation.
          </small>
        </div>
      </div>
    </section>
  );
}
