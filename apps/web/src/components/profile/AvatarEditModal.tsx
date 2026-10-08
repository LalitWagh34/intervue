import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useUpdateAvatar } from "@/hooks/useProfile";

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  googleAvatar?: string | null;
  userName?: string;
}

// Preset avatars with colorful gradient styles
const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=0284c7",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna&backgroundColor=7c3aed",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nova&backgroundColor=10b981",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zephyr&backgroundColor=f59e0b",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Coder&backgroundColor=1e293b",
  "https://api.dicebear.com/7.x/identicon/svg?seed=IntervueTech&backgroundColor=0f172a",
];

export function AvatarEditModal({
  isOpen,
  onClose,
  currentAvatar,
  googleAvatar,
  userName = "Candidate",
}: AvatarEditModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">("upload");
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar || googleAvatar || "");
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAvatarMutation = useUpdateAvatar();

  // Helper to compress and convert uploaded image into high-quality lightweight data URI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file should be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Draw and compress to 256x256 square canvas
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Crop centered square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        // Convert to webp with high quality
        const dataUrl = canvas.toDataURL("image/webp", 0.88);
        setPreviewUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setUrlError("Please enter an image link");
      return;
    }
    setUrlError(null);
    setPreviewUrl(urlInput.trim());
  };

  const handleResetToGoogle = () => {
    if (googleAvatar) {
      setPreviewUrl(googleAvatar);
      toast.info("Selected Google profile picture");
    } else {
      toast.info("No Google profile photo found for this account");
    }
  };

  const handleSave = async () => {
    try {
      await updateAvatarMutation.mutateAsync(previewUrl || null);
      toast.success("Profile photo updated successfully!");
      onClose();
    } catch {
      toast.error("Failed to update profile photo");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0D0E12] border border-[#181A20] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Camera className="w-4 h-4 text-blue-400" />
            <span>Update Profile Picture</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8B92A0]">
            Use your Google account photo, upload your own picture, or choose a custom avatar.
          </DialogDescription>
        </DialogHeader>

        {/* Live Preview Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#08090C] rounded-2xl border border-[#181A20] mb-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-[#14161C] border-2 border-blue-500/40 p-1 shadow-xl overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => {
                    setUrlError("Could not load image from this URL");
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 border-2 border-[#08090C] flex items-center justify-center text-white shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[11px] font-mono text-[#7A808C] mt-3">Live Profile Preview</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#14161C] rounded-xl border border-[#1E2229] mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-[#08090C] text-white shadow-sm font-semibold border border-[#272B33]"
                : "text-[#7A808C] hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "url"
                ? "bg-[#08090C] text-white shadow-sm font-semibold border border-[#272B33]"
                : "text-[#7A808C] hover:text-white"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "presets"
                ? "bg-[#08090C] text-white shadow-sm font-semibold border border-[#272B33]"
                : "text-[#7A808C] hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Presets
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[110px] mb-4">
          {activeTab === "upload" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border border-dashed border-[#272B33] hover:border-blue-500/50 rounded-xl bg-[#08090C]/50 hover:bg-[#14161C]/50 transition-all cursor-pointer text-center group"
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-[#7A808C] group-hover:text-blue-400 transition-colors" />
                <p className="text-xs font-semibold text-white">Click to browse your photo</p>
                <p className="text-[10px] text-[#525866] mt-0.5 font-mono">PNG, JPG, or WEBP (Max 5MB)</p>
              </div>

              {googleAvatar && (
                <button
                  type="button"
                  onClick={handleResetToGoogle}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#14161C] border border-[#1E2229] hover:border-zinc-700 text-xs text-[#8B92A0] hover:text-white transition-all cursor-pointer font-mono"
                >
                  <RotateCcw className="w-3 h-3 text-blue-400" />
                  <span>Use Original Google Profile Photo</span>
                </button>
              )}
            </div>
          )}

          {activeTab === "url" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#8B92A0] mb-1.5 block">Image Web Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-[#08090C] border-[#181A20] text-xs text-white focus:border-blue-500 rounded-xl"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyUrl}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 rounded-xl cursor-pointer"
                  >
                    Preview
                  </Button>
                </div>
                {urlError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-mono">
                    <AlertCircle className="w-3 h-3" />
                    {urlError}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "presets" && (
            <div>
              <p className="text-[11px] text-[#7A808C] font-mono mb-2">Pick an avatar preset:</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(preset);
                      setUrlError(null);
                    }}
                    className={`w-12 h-12 rounded-xl p-0.5 bg-[#08090C] border transition-all cursor-pointer hover:scale-105 overflow-hidden ${
                      previewUrl === preset
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-[#1E2229] hover:border-zinc-700"
                    }`}
                  >
                    <img src={preset} alt="" className="w-full h-full object-contain rounded-lg" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#181A20]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-[#8B92A0] hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={updateAvatarMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer font-semibold"
          >
            {updateAvatarMutation.isPending ? "Saving..." : "Save Picture"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
