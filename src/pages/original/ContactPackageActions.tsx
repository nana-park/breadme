import { useId, useRef, useState } from "react";
import { contactPackage } from "@/content/site/contactPackage";
import styles from "./ContactPackageActions.module.css";

export type ContactMaterialsOpener = (trigger: HTMLButtonElement) => void;
type CopyState = "idle" | "copying" | "copied" | "failed";

const downloadPath =
  "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4";
const linkPath =
  "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1";

function ActionIcon({ copy = false }: { copy?: boolean }) {
  return (
    <svg
      className={styles.icon}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d={copy ? linkPath : downloadPath}
      />
    </svg>
  );
}

/** WHAT: Working direct actions for the Contact package, with honest pending files. */
export function ContactPackageActions({
  onOpenMaterials,
}: {
  onOpenMaterials: ContactMaterialsOpener;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const isCopying = useRef(false);
  const statusId = useId();
  const manualCopyId = useId();

  async function copyPortfolioUrl() {
    // WHY: Ignore re-entry while a permission prompt/write is pending; never
    // report a successful copy until the Clipboard API confirms its write.
    if (isCopying.current) return;
    isCopying.current = true;
    setCopyState("copying");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(contactPackage.portfolioUrl);
    } catch {
      // WHY: Denied or unsupported clipboard access still offers a selectable
      // URL, without silently using a second copying mechanism or false success.
      setCopyState("failed");
      window.alert(contactPackage.copyFailed);
      isCopying.current = false;
      return;
    }
    setCopyState("copied");
    window.alert(contactPackage.copied);
    isCopying.current = false;
  }

  return (
    <div className={styles.actions} data-contact-package-actions>
      <div className={styles.buttons}>
        {(["resume", "portfolio"] as const).map((action) => (
          <button
            key={action}
            type="button"
            className={styles.button}
            data-materials-action={action}
            aria-controls="materials-content"
            onClick={(event) => onOpenMaterials(event.currentTarget)}
          >
            <ActionIcon />
            {contactPackage[action]}
          </button>
        ))}
        <button
          type="button"
          className={styles.button}
          onClick={() => void copyPortfolioUrl()}
          aria-busy={copyState === "copying"}
          aria-describedby={statusId}
        >
          <ActionIcon copy />
          {contactPackage.copy}
        </button>
      </div>
      {/* The requested native alert announces success once; keep only progress
          and actionable errors in the live region, without a second success announcement. */}
      <p
        id={statusId}
        className={styles.status}
        lang={copyState === "failed" ? "ko" : undefined}
        role="status"
        aria-atomic="true"
      >
        {copyState === "copying" && contactPackage.copying}
        {copyState === "failed" && contactPackage.copyFailed}
      </p>
      {copyState === "failed" && (
        <div className={styles.manualCopy}>
          <label htmlFor={manualCopyId}>{contactPackage.manualCopyLabel}</label>
          <input
            id={manualCopyId}
            type="text"
            readOnly
            value={contactPackage.portfolioUrl}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  );
}
