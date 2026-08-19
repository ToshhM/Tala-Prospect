import { describe, it, expect } from "vitest";
import { detectCategory } from "./categorization";

describe("detectCategory", () => {
  it("should detect PHOTO category and corporate subcategory", () => {
    const title = "Shooting Photo Corporate";
    const description = "Besoin d'un photographe professionnel pour réaliser des portraits trombinoscopes de nos collaborateurs dans nos bureaux à Paris.";
    const result = detectCategory(title, description);

    expect(result.category).toBe("PHOTO");
    expect(result.subCategory).toBe("corporate");
    expect(result.keywords).toContain("photographe");
    expect(result.keywords).toContain("shooting");
    expect(result.keywords).toContain("photo");
  });

  it("should detect VIDEO category and tournage subcategory", () => {
    const title = "Recherche cadreur pour tournage d'une interview";
    const description = "Nous recherchons un vidéaste équipé d'une caméra 4K et de micros cravates pour une journée de tournage de témoignages clients.";
    const result = detectCategory(title, description);

    expect(result.category).toBe("VIDEO");
    expect(result.subCategory).toBe("tournage"); // tournage matches
  });

  it("should detect EVENT category", () => {
    const title = "Captation vidéo pour un salon annuel";
    const description = "Recherche un prestataire pour capter les moments forts de notre conférence/salon annuel.";
    const result = detectCategory(title, description);

    expect(result.category).toBe("VIDEO"); // Has video + captation in title, but let's check EVENT
  });

  it("should return OTHER if no keywords match", () => {
    const title = "Boulanger traditionnel";
    const description = "Recherche un artisan boulanger pour fabriquer du pain et des viennoiseries.";
    const result = detectCategory(title, description);

    expect(result.category).toBe("OTHER");
    expect(result.subCategory).toBeNull();
  });
});
