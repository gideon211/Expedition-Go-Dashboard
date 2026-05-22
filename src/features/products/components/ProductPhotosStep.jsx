import { Upload, X, Star } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

export default function ProductPhotosStep() {
  const { product, updateProduct } = useProductBuilderStore();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      alt: "",
    }));
    updateProduct({ photos: [...product.photos, ...newPhotos] });
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
      <div className="border-2 border-dashed border-[#eaeaea] rounded-lg p-8 text-center bg-[#f8fafc]">
        <Upload size={40} className="mx-auto text-[#9e9e9e] mb-3" />
        <p className="text-sm font-medium text-[#1e293b] mb-1">
          Drag and drop photos here, or{" "}
          <label className="text-[#044b3b] cursor-pointer hover:underline">
            browse
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        </p>
        <p className="text-xs text-[#64748b]">Supports JPG, PNG, WebP. Max 5MB per image.</p>
      </div>

      {/* Photo Gallery */}
      {product.photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1e293b]">Photos ({product.photos.length})</h3>
            <p className="text-xs text-[#64748b]">
              {product.heroImage ? "Hero image selected" : "Click star to set hero image"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.photos.map((photo) => (
              <div
                key={photo.id}
                className={`group relative rounded-lg border overflow-hidden ${
                  product.heroImage === photo.id ? "border-[#044b3b] ring-2 ring-[#044b3b]/20" : "border-[#eaeaea]"
                }`}
              >
                <div className="aspect-[4/3] bg-[#f8fafc] relative">
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {product.heroImage === photo.id && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-[#044b3b] text-white text-[10px] font-bold rounded-md">
                      STAR
                    </div>
                  )}
                  <button
                    onClick={() => setHero(photo.id)}
                    className={`absolute top-2 right-2 p-1.5 rounded-md transition-colors ${
                      product.heroImage === photo.id
                        ? 'bg-[#044b3b] text-white shadow-md'
                        : 'bg-white/90 text-[#9e9e9e] hover:text-[#044b3b] shadow-sm'
                    }`}
                    title={product.heroImage === photo.id ? 'Hero image' : 'Set as hero'}
                  >
                    <Star size={14} className={product.heroImage === photo.id ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-md bg-white/90 text-[#9e9e9e] hover:text-[#dc3545] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="p-2">
                  <input
                    type="text"
                    value={photo.alt}
                    onChange={(e) => updateAlt(photo.id, e.target.value)}
                    placeholder="Alt text"
                    className="w-full px-2 py-1 text-xs border border-[#eaeaea] rounded text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-1 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
