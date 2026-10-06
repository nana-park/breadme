import { homePartners } from "@/content/site/homePartners";
import { assetUrl } from "@/shared/utils/originalPaths";
import lineWorksLogo from "./assets/line-works-corporate.svg";
import skIncLogo from "./assets/sk-inc.svg";
import styles from "./HomePartnerLogos.module.css";

const logoHeights = {
  naver: 22,
  "naver-cloud": 24,
  "sk-telecom": 44,
  "sk-inc": 30,
  "line-works": 26,
  hm: 29,
} as const;

/** WHAT: Three equal cycles of the approved six companies, using official artwork. */
export function HomePartnerLogos() {
  return (
    <div className={`logo-track ${styles.track}`}>
      {[0, 1, 2].map((cycle) =>
        homePartners.map((partner) => {
          const source = partner.originalAsset
            ? assetUrl(partner.originalAsset)
            : partner.id === "sk-inc"
              ? skIncLogo
              : lineWorksLogo;
          const image = (
            <img
              src={source}
              alt={cycle === 0 ? partner.name : ""}
              aria-hidden={cycle === 0 ? undefined : true}
              className={
                partner.id === "sk-inc" ? styles.holdingImage : undefined
              }
              style={
                partner.id === "sk-inc"
                  ? undefined
                  : {
                      height: `${logoHeights[partner.id]}px`,
                      width: "auto",
                      filter: partner.originalAsset
                        ? "grayscale(100%) opacity(0.45)"
                        : undefined,
                      alignSelf:
                        partner.id === "sk-telecom" ? "flex-start" : "center",
                      transform:
                        partner.id === "sk-telecom"
                          ? "translateY(-10px)"
                          : undefined,
                    }
              }
            />
          );
          return partner.id === "sk-inc" ? (
            <span
              className={styles.holdingFrame}
              data-partner={partner.id}
              data-cycle={cycle}
              key={`${cycle}-${partner.id}`}
            >
              {image}
            </span>
          ) : (
            <span
              className={styles.logoFrame}
              data-partner={partner.id}
              data-cycle={cycle}
              key={`${cycle}-${partner.id}`}
            >
              {image}
            </span>
          );
        }),
      )}
    </div>
  );
}
