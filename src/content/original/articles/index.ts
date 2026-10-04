import type { ComponentType } from "react";
import { Article66504Body } from "./Article66504Body";
import { Article65617Body } from "./Article65617Body";
import { Article65427Body } from "./Article65427Body";
import { Article64006Body } from "./Article64006Body";
import { Article63259Body } from "./Article63259Body";
import { Article60586Body } from "./Article60586Body";
import { Article58579Body } from "./Article58579Body";
import { Article58119Body } from "./Article58119Body";
import { Article56148Body } from "./Article56148Body";
import { Article54710Body } from "./Article54710Body";
import { Article54170Body } from "./Article54170Body";
import { Article53074Body } from "./Article53074Body";
import { Article52537Body } from "./Article52537Body";
import { Article51061Body } from "./Article51061Body";
import { Article50529Body } from "./Article50529Body";
import { Article50044Body } from "./Article50044Body";
import { Article50043Body } from "./Article50043Body";
import { Article47268Body } from "./Article47268Body";

export type OriginalArticle = {
  id: string;
  url: string;
  date: string;
  title: string;
  excerpt: string;
  Body: ComponentType;
};
/** WHAT: Source article metadata in original newest-first order.
 * WHY: Keep the English source content separate from list/detail layout. */
export const originalArticles: readonly OriginalArticle[] = [
  {
    id: "66504",
    url: "https://www.artinsight.co.kr/news/view.php?no=66504",
    date: "2023.09.01",
    title: "Super-giant AI that can only be completed with people",
    excerpt:
      "As the AI era advances, human data labeling remains the critical foundation for training machine learning models. Despite technological leaps, the quality and accuracy of AI systems heavily depend on meticulous human effort. This symbiotic relationship highlights that even the most advanced artificial intelligence is ultimately grounded in human intelligence.",
    Body: Article66504Body,
  },
  {
    id: "65617",
    url: "https://www.artinsight.co.kr/news/view.php?no=65617",
    date: "2023.07.04",
    title: "AI, how do we overcome it?",
    excerpt:
      "The rapid development of artificial intelligence raises profound questions about the future of humanity and our place in an automated world. Rather than fearing obsolescence, we must focus on cultivating uniquely human traits such as creativity and emotional intelligence. By embracing continuous learning, we can leverage AI as a powerful tool while preserving our essential human value.",
    Body: Article65617Body,
  },
  {
    id: "65427",
    url: "https://www.artinsight.co.kr/news/view.php?no=65427",
    date: "2023.06.22",
    title: "AI, why is it so difficult?",
    excerpt:
      "Understanding and applying artificial intelligence remains challenging for many due to its complex underlying mechanics and rapid evolution. The steep learning curve is exacerbated by the abstract nature of machine learning models and the mathematical concepts driving them. To bridge this gap, society needs more accessible education and intuitive frameworks that demystify AI technologies.",
    Body: Article65427Body,
  },
  {
    id: "64006",
    url: "https://www.artinsight.co.kr/news/view.php?no=64006",
    date: "2023.03.25",
    title: "Art, a unique human domain that AI cannot invade",
    excerpt:
      "While artificial intelligence can mimic artistic styles and generate impressive visuals, true art remains a profound expression of human emotion and lived experience. The essence of creativity is deeply rooted in our consciousness and historical context, something an algorithm cannot genuinely replicate. Ultimately, art serves as a unique testament to human vulnerability that machines cannot invade.",
    Body: Article64006Body,
  },
  {
    id: "63259",
    url: "https://www.artinsight.co.kr/news/view.php?no=63259",
    date: "2023.02.01",
    title: "I expected AI to take my job away, but not like this!",
    excerpt:
      "The anticipated impact of AI on the workforce was often envisioned as replacing manual labor, but the reality is much more nuanced. Automation is increasingly encroaching on creative, intellectual, and white-collar professions, fundamentally shifting the nature of work. This unexpected trajectory forces professionals to urgently redefine their roles and discover new ways to collaborate with intelligent algorithms.",
    Body: Article63259Body,
  },
  {
    id: "60586",
    url: "https://www.artinsight.co.kr/news/view.php?no=60586",
    date: "2022.07.06",
    title:
      "(Suppressionism) Our literacy - a social problem and a way to counter AI",
    excerpt:
      "The decline in deep reading and critical thinking skills has become a pressing social issue in our fast-paced, digitally saturated environment. True literacy now requires the ability to navigate complex information, discern nuance, and maintain focus amidst constant digital distractions. Fostering this advanced literacy is not only crucial for civic engagement but also serves as our best defense against the manipulative potential of AI.",
    Body: Article60586Body,
  },
  {
    id: "58579",
    url: "https://www.artinsight.co.kr/news/view.php?no=58579",
    date: "2022.02.28",
    title: "People who blog rather than Instagram: SNS nomads",
    excerpt:
      "As visual-heavy platforms like Instagram dominate the social media landscape, a growing counter-movement of 'SNS nomads' is returning to text-based blogging. These individuals seek deeper, more meaningful digital interactions and a refuge from the pressures of curated visual perfection. By embracing longer-form content, they prioritize authentic self-expression and community building over fleeting aesthetic trends.",
    Body: Article58579Body,
  },
  {
    id: "58119",
    url: "https://www.artinsight.co.kr/news/view.php?no=58119",
    date: "2022.02.03",
    title:
      "It's a new year, so what if you write down the books you read during January on your tablet?",
    excerpt:
      "The start of a new year presents a perfect opportunity to build sustainable reading habits by tracking your progress digitally. Utilizing a tablet to log books not only organizes your literary journey but also provides a satisfying visual representation of your accomplishments. This simple digital practice can significantly boost motivation and help you maintain your reading goals throughout the year.",
    Body: Article58119Body,
  },
  {
    id: "56148",
    url: "https://www.artinsight.co.kr/news/view.php?no=56148",
    date: "2021.10.01",
    title: "Phonosapiens prefer text messages to face-to-face conversations.",
    excerpt:
      "As communication shifts from face-to-face conversations to text messaging, humanity is increasingly becoming 'phonosapiens' who find typing more comfortable than speaking. While text provides time to refine thoughts and minimizes effort, it also strips away essential non-verbal cues, leading to potential misunderstandings. As digital interaction dominates, adapting with dynamic tools like emoticons becomes crucial to maintain meaningful connections.",
    Body: Article56148Body,
  },
  {
    id: "54710",
    url: "https://www.artinsight.co.kr/news/view.php?no=54710",
    date: "2021.07.01",
    title: "Alzheimer's coming to the digital generation?",
    excerpt:
      "The concept of 'Youngzheimer's' highlights how the digital generation is experiencing memory issues, not as a disease, but as a shift in cognitive processing due to smartphone use. As we adapt to an information-rich environment, our brains prioritize rapid decision-making and selective knowledge acquisition over traditional memorization. Rather than resisting this change, we must embrace digital literacy and learn to navigate this new cognitive landscape.",
    Body: Article54710Body,
  },
  {
    id: "54170",
    url: "https://www.artinsight.co.kr/news/view.php?no=54170",
    date: "2021.05.31",
    title: "Some ways we watch Netflix",
    excerpt:
      "The way we consume media on platforms like Netflix has evolved significantly, moving from traditional viewing to binge-watching, sparse viewing, and even watching summarized versions on YouTube. This shift reflects a decentralized culture where individuals tailor their content consumption to fit fast-paced, modern lifestyles. As content is endlessly reproduced and personalized, we are witnessing a new era of diverse and fragmented cultural experiences.",
    Body: Article54170Body,
  },
  {
    id: "53074",
    url: "https://www.artinsight.co.kr/news/view.php?no=53074",
    date: "2021.03.30",
    title: "Can it permeate audiobooks?",
    excerpt:
      "Despite the rapid growth of the audiobook market, driven by the demand for auditory stimulation and multitasking convenience, questions remain about its long-term sustainability. Modern listeners, accustomed to rich visual content, may find audiobooks challenging to engage with deeply without accompanying visual cues. While audiobooks offer potential benefits, such as accessibility, they still struggle to fully replace the immersive experience of traditional or visual reading.",
    Body: Article53074Body,
  },
  {
    id: "52537",
    url: "https://www.artinsight.co.kr/news/view.php?no=52537",
    date: "2021.02.28",
    title: "Features that will or will never appear in Clubhouse",
    excerpt:
      "Clubhouse introduced a unique social media paradigm focused on real-time, multi-directional audio communication within an 'open space' environment. Despite its initial surge in popularity driven by exclusivity and FOMO, the platform faces challenges regarding user fatigue, lack of recording features, and content moderation. To sustain its growth, Clubhouse must balance its distinct audio-centric identity with the evolving demands of its diverse user base.",
    Body: Article52537Body,
  },
  {
    id: "51061",
    url: "https://www.artinsight.co.kr/news/view.php?no=51061",
    date: "2020.12.01",
    title: "The only smart device that makes me addicted",
    excerpt:
      "Smartphone addiction has subtly evolved from a minor distraction into a pervasive force that intertwines with our professional and social lives. The constant need for connectivity and the fear of missing out keep us tethered to our devices, complicating efforts to unplug and find genuine downtime. Recognizing this dependency is the first step toward establishing healthier digital boundaries and reclaiming our offline presence.",
    Body: Article51061Body,
  },
  {
    id: "50529",
    url: "https://www.artinsight.co.kr/news/view.php?no=50529",
    date: "2020.10.30",
    title: "Barney, Barney, carrot, carrot, a sound that reduces loneliness",
    excerpt:
      "I have a friend who particularly hates carrots in curry. My dog ​​does not eat carrots unless they are domestically grown carrots. And ‘Carrot Market’, a mobile-based second-hand trading platform, does ...",
    Body: Article50529Body,
  },
  {
    id: "50044",
    url: "https://www.artinsight.co.kr/news/view.php?no=50044",
    date: "2020.10.02",
    title:
      "Coexistence with new technologies - ② Reorganization of research direction and targets",
    excerpt:
      "When I was in elementary school, if I was given a choice between writing an essay or a drawing contest, I would choose to draw. In particular, in scientific imagination, cars flying in the air inside a...",
    Body: Article50044Body,
  },
  {
    id: "50043",
    url: "https://www.artinsight.co.kr/news/view.php?no=50043",
    date: "2020.09.30",
    title: "Coexistence with new technologies - ① Elderly cognition",
    excerpt:
      "Recently, I responded to a research interview titled <Youth Generation's Perception of Elderly>. I thought he was concerned about the issue of alienation, but he had nothing to say when asked, “Are you...",
    Body: Article50043Body,
  },
  {
    id: "47268",
    url: "https://www.artinsight.co.kr/news/view.php?no=47268",
    date: "2020.04.14",
    title: "Hockney’s iPad",
    excerpt:
      "The preference for domestic popular art can be roughly seen by looking at cafe interiors. Last fall, Henri Matisse (1869-1954) and David Hockney (1937- ) were frequently seen. Anyone who is not interest...",
    Body: Article47268Body,
  },
];
