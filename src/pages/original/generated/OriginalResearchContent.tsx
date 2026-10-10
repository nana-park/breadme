import type { CSSProperties } from 'react';
import { LandingPhotoHero } from '../LandingPhotoHero';
import { ResearchSections } from '../ResearchSections';

/** Canonical source conversion delegates the reviewed publication content to one owner. */
export function OriginalResearchContent() {
  return (
    <section className="pb-24 bg-white" id="research" style={{ paddingTop: '70px' } as CSSProperties}>
      <LandingPhotoHero page="research" />
      <div className="container mx-auto px-4 lg:px-12 max-w-[1400px]">
        <ResearchSections />
      </div>
    </section>
  );
}
