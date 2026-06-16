import { useRef, useState, useCallback } from "react";
import { Upload, Trash2 } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

export default function ProductPhotosStep() {
  const { product, updateProduct } = useProductBuilderStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFiles = useCallback((files) => {
    const currentPhotos = useProductBuilderStore.getState().product.photos;
    const newPhotos = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      alt: "",
    }));
    if (newPhotos.length > 0) {
      updateProduct({ photos: [...currentPhotos, ...newPhotos] });
    }
  }, [updateProduct]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files?.length) {
      processFiles(files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files?.length) {
      processFiles(files);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = (id) => {
    const updated = {
      photos: product.photos.filter((p) => p.id !== id),
    };
    if (product.heroImage === id) {
      updated.heroImage = null;
    }
    updateProduct(updated);
  };

  const setHero = (id) => {
    updateProduct({ heroImage: id });
  };

  const updateAlt = (id, alt) => {
    const newPhotos = product.photos.map((p) =>
      p.id === id ? { ...p, alt } : p
    );
    updateProduct({ photos: newPhotos });
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? "border-emerald-600 bg-emerald-50"
            : "border-slate-200 bg-slate-50 hover:border-emerald-600 hover:bg-emerald-50/50"
        }`}
      >
        <Upload size={40} className="mx-auto text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-800 mb-1">
          Drag and drop photos here, or{" "}
          <span className="text-emerald-600 hover:underline">browse</span> to choose files
        </p>
        <p className="text-xs text-slate-500">Supports JPG, PNG, WebP. Max 5MB per image.</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Photo Gallery */}
      {product.photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Photos ({product.photos.length})</h3>
            <p className="text-xs text-slate-500">
              {product.heroImage ? "Thumbnail selected" : "Select a thumbnail for your product"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.photos.map((photo) => (
              <div
                key={photo.id}
                className={`group relative rounded-xl border overflow-hidden ${
                  product.heroImage === photo.id ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-slate-200"
                }`}
              >
                <div className="aspect-[4/3] bg-slate-50 relative">
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('ProductPhotosStep photo failed:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                  {product.heroImage === photo.id && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                      THUMBNAIL
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-md bg-white/90 text-slate-400 hover:text-red-500 shadow-sm opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-2 space-y-2">
                  <input
                    type="text"
                    value={photo.alt}
                    onChange={(e) => updateAlt(photo.id, e.target.value)}
                    placeholder="Alt text"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => setHero(photo.id)}
                    className={`w-full text-[11px] font-medium py-1 rounded transition-colors ${
                      product.heroImage === photo.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-400 hover:text-emerald-600 hover:bg-slate-50"
                    }`}
                  >
                    {product.heroImage === photo.id ? "Thumbnail \u2713" : "Set as thumbnail"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
