"use client";

import { useState } from "react";
import PreviewModal from "./PreviewModal";

interface PreviewButtonProps {
  resourceId: number;
  resourceTitle: string;
  variant?: "card" | "detail"; // 卡片模式 或 详情页模式
  className?: string;
}

export default function PreviewButton({
  resourceId,
  resourceTitle,
  variant = "detail",
  className = ""
}: PreviewButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <>
      <button
        onClick={handlePreview}
        className={`${
          variant === "card"
            ? "btn-secondary text-sm"
            : "btn-secondary w-full"
        } ${className}`}
      >
        👁 预览
      </button>

      {showPreview && (
        <PreviewModal
          resourceId={resourceId}
          resourceTitle={resourceTitle}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
