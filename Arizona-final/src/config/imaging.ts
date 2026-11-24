export const scanImages = {
  normal: {
    asset: "normal-brain",
    file: "/images/normal-brain.png",
    title: "Normal brain anatomy",
    alt: "Real non-contrast axial head CT, published as normal anatomy without injury",
    caption:
      "An example of normal anatomy on a non-contrast head CT. This slice is at a different level from the infarct example.",
    author: "Mikael Häggström, MD",
    source:
      "https://commons.wikimedia.org/wiki/File:CT_of_a_normal_brain,_axial_25.png",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  infarct: {
    asset: "brain-infarct",
    file: "/images/brain-infarct.jpg",
    title: "Middle cerebral artery infarct",
    alt: "Real published head CT of a middle cerebral artery territory infarct",
    caption:
      "A separate patient’s CT published as an example of ischemic stroke. Findings depend on timing, technique and clinical context.",
    author: "Lucien Monfils",
    source: "https://commons.wikimedia.org/wiki/File:CT_Brain_MCA_Infarct.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  chest: {
    asset: "chest-comparison",
    file: "/images/chest-comparison.jpg",
    title: "Normal and pneumonia chest X-rays",
    alt: "Source-labeled real chest radiographs: pneumonia on the left and normal on the right",
    caption:
      "The source labels the left image Pneumonia and the right image Normal. These are separate examinations; an X-ray alone cannot reliably establish the causative organism.",
    author: "NahomNati",
    source:
      "https://commons.wikimedia.org/wiki/File:Chest_X-ray_images_showing_normal_and_pneumonia.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
} as const;
export type ScanImage = (typeof scanImages)[keyof typeof scanImages];
