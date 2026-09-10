import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  ArrowUp,
  ArrowDown,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ImageIcon,
  X
} from "lucide-react";
import {
  getAllCarouselSlidesAdmin,
  createCarouselSlideAdmin,
  updateCarouselSlideAdmin,
  deleteCarouselSlideAdmin,
  uploadCarouselImageAdmin,
  type CarouselSlide
} from "@/lib/carousel";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function CarouselManager() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [previewSlide, setPreviewSlide] = useState<CarouselSlide | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSlides = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAllCarouselSlidesAdmin();
      setSlides(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load carousel slides.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openCreateModal = () => {
    setEditingSlide(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setCtaText("");
    setCtaUrl("");
    setDisplayOrder(slides.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setDescription(slide.description);
    setImageUrl(slide.image_url);
    setCtaText(slide.cta_text || "");
    setCtaUrl(slide.cta_url || "");
    setDisplayOrder(slide.display_order);
    setIsActive(slide.is_active);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("Image file exceeds 20MB size limit.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const uploadedUrl = await uploadCarouselImageAdmin(file);
      setImageUrl(uploadedUrl);
      setSuccessMessage("Image uploaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !imageUrl.trim()) {
      setErrorMessage("Title, description, and image URL are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const slideData: Partial<CarouselSlide> = {
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      cta_text: ctaText.trim() || undefined,
      cta_url: ctaUrl.trim() || undefined,
      display_order: Number(displayOrder) || 1,
      is_active: isActive
    };

    try {
      if (editingSlide) {
        await updateCarouselSlideAdmin(editingSlide.id, slideData);
        setSuccessMessage("Carousel slide updated successfully!");
      } else {
        await createCarouselSlideAdmin(slideData);
        setSuccessMessage("New carousel slide created successfully!");
      }
      setIsModalOpen(false);
      await fetchSlides();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save carousel slide.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (slide: CarouselSlide) => {
    try {
      await updateCarouselSlideAdmin(slide.id, { is_active: !slide.is_active });
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s))
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to toggle status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this carousel slide?")) return;

    try {
      await deleteCarouselSlideAdmin(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
      setSuccessMessage("Slide deleted successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete slide.");
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];

    const currentOrder = currentSlide.display_order;
    const targetOrder = targetSlide.display_order;

    try {
      await Promise.all([
        updateCarouselSlideAdmin(currentSlide.id, { display_order: targetOrder }),
        updateCarouselSlideAdmin(targetSlide.id, { display_order: currentOrder })
      ]);
      await fetchSlides();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reorder slides.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-foreground">Homepage Spotlight Carousel</h2>
          <p className="text-sm text-muted-foreground">
            Manage highlight slides showcased on the public landing page below the Verified Academic Repository.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus aria-hidden="true" className="size-4" /> Create New Slide
        </Button>
      </div>

      {successMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 text-destructive shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted border border-border" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Layers aria-hidden="true" className="size-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold font-serif text-foreground">No Carousel Slides Configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">Click "Create New Slide" to add an institutional spotlight.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative h-44 w-full bg-muted overflow-hidden">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs",
                        slide.is_active
                          ? "bg-emerald-500/90 text-white"
                          : "bg-slate-700/80 text-white/80"
                      )}
                    >
                      {slide.is_active ? "Active" : "Disabled"}
                    </span>
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-2xs font-semibold text-white backdrop-blur-md">
                      #{slide.display_order}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold font-serif text-foreground text-lg line-clamp-1">{slide.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {slide.description}
                  </p>

                  {slide.cta_text && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span>CTA: {slide.cta_text}</span>
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleReorder(index, "up")}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Move slide up"
                  >
                    <ArrowUp aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(index, "down")}
                    disabled={index === slides.length - 1}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Move slide down"
                  >
                    <ArrowDown aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(slide)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-2xs font-bold border transition-colors",
                      slide.is_active
                        ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "border-muted-foreground/30 text-muted-foreground bg-muted hover:bg-muted/80"
                    )}
                  >
                    {slide.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewSlide(slide)}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                    title="Preview slide"
                  >
                    <Eye aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="p-1.5 rounded-lg border border-border bg-card text-primary hover:bg-primary/10"
                    title="Edit slide"
                  >
                    <Edit2 aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(slide.id)}
                    className="p-1.5 rounded-lg border border-border bg-card text-destructive hover:bg-destructive/10"
                    title="Delete slide"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 my-8">
            <h3 className="text-xl font-bold font-serif text-foreground mb-1">
              {editingSlide ? "Edit Spotlight Slide" : "Create New Spotlight Slide"}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Configure headline, description, image, and optional destination action.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Slide Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Aeronautics & Defense Systems Archive"
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the academic initiative or repository collection..."
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                />
              </div>

              {/* Image selection and upload (Direct upload of any format) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Slide Image Cover *
                </label>

                {/* Direct Upload Zone */}
                <div className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 p-4 transition-colors">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <ImageIcon aria-hidden="true" className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Upload cover image from your device</p>
                        <p className="text-2xs text-muted-foreground">Accepts any format (PNG, JPG, WebP, GIF, SVG, BMP, AVIF, etc. up to 20MB)</p>
                      </div>
                    </div>
                    <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-semibold text-primary-foreground cursor-pointer shrink-0 transition-colors shadow-xs">
                      <Upload aria-hidden="true" className="size-4" />
                      <span>{isUploading ? "Uploading..." : "Select Image File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {/* Active Preview */}
                  {imageUrl && (
                    <div className="relative mt-3 h-40 w-full rounded-xl overflow-hidden border border-border bg-black/40 group">
                      <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3">
                        <span className="text-2xs font-medium text-white/90 truncate max-w-xs">{imageUrl}</span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setImageUrl("")}
                          className="size-7 p-0"
                          title="Remove image"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional URL input / presets for flexibility */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-2xs text-muted-foreground">
                    <span>Or enter an external image URL:</span>
                    <div className="flex items-center gap-1.5">
                      <span>Presets:</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl("https://images.unsplash.com/photo-1517976487502-d5966a3d92fb?auto=format&fit=crop&w=1600&q=80")}
                        className="underline hover:text-primary"
                      >
                        Aerospace
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl("https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80")}
                        className="underline hover:text-primary"
                      >
                        AI
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80")}
                        className="underline hover:text-primary"
                      >
                        Defense
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                  />
                </div>
              </div>

              {/* Call to action controls */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Explore Aerospace Papers"
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Destination URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="e.g. /departments/aerospace-engineering"
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="size-4 rounded-md border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-semibold text-foreground">Active on public landing page</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? "Saving..." : editingSlide ? "Update Slide" : "Create Slide"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Slide Preview
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewSlide(null)}>
                Close Preview
              </Button>
            </div>

            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden shadow-inner">
              <img
                src={previewSlide.image_url}
                alt={previewSlide.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end max-w-xl">
                <span className="inline-flex w-fit items-center rounded-full bg-primary px-3 py-0.5 text-2xs font-bold uppercase tracking-wider text-white mb-2">
                  Institutional Spotlight
                </span>
                <h3 className="text-2xl font-extrabold font-serif text-white">{previewSlide.title}</h3>
                <p className="mt-2 text-sm text-slate-200 leading-relaxed">{previewSlide.description}</p>
                {previewSlide.cta_text && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md">
                      {previewSlide.cta_text} &rarr;
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
