"use client";

import React from "react";
import { LandingNavbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { ProductShowcaseSection } from "./ProductShowcaseSection";
import { ComparisonSection } from "./ComparisonSection";
import { FaqSection } from "./FaqSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { LandingFooter } from "./LandingFooter";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0F172A] selection:bg-[#DCFCE7] selection:text-[#15803D]">
      <LandingNavbar />
      <div className="flex flex-col">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductShowcaseSection />
        <ComparisonSection />
        <FaqSection />
        <FinalCtaSection />
      </div>
      <LandingFooter />
    </div>
  );
};
