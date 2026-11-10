import type { Metadata } from "next";
import { HomeExperience } from "@/components/experience/HomeExperience";
import { homeQuestions } from "@/components/experience/content";

export const metadata: Metadata = {
  title: "Crédito rural e gestão do agro",
  description:
    "Conecte crédito rural, CPR, documentos e gestão do campo em uma plataforma. Acesse pela web ou pelo app para iPhone e iPad.",
  openGraph: {
    title: "ConectCampo | Seu agro, mais conectado",
    description:
      "Crédito, gestão e oportunidades em uma só plataforma. Do escritório à palma da mão.",
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: homeQuestions.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          }),
        }}
      />
      <HomeExperience />
    </>
  );
}
