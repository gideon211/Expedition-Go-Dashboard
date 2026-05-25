import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Trash2, Loader2, AlertCircle, MapPin, Clock, Users, Star, Globe, DollarSign, Calendar, Check, X as XIcon, Languages, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMyProduct, deleteProduct } from "@/features/products/api";
import StatusBadge from "@/components/shared/StatusBadge";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    getMyProduct(id)
      .then((res) => {
        const data = res.data?.data?.tour;
        if (!data) {
          setError("Product not found");
          return;
        }
        setTour(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Failed to load product");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    setDeleting(true);
    deleteProduct(id)
      .then(() => {
        toast.success("Product deleted successfully");
        navigate("/products");
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || "Failed to delete product");
      })
      .finally(() => setDeleting(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#044b3b]" />
          <p className="text-sm text-[#64748b]">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-6 max-w-md text-center">
            <AlertCircle size={40} className="text-[#dc2626] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#991b1b] mb-2">Failed to Load Product</h2>
            <p className="text-sm text-[#b91c1c] mb-4">{error}</p>
            <button
              onClick={() => navigate("/products")}
              className="px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) return null;

  const categorization = tour.categorization || {};
  const content = tour.productContent || {};
  const schedules = tour.schedulesAndPricing || {};
  const booking = tour.bookingAndTickets || {};
  const pricingSchedules = schedules.pricingSchedules || {};
  const pricing = pricingSchedules.schedules?.[0] || {};
  const cancellation = booking.cancellationPolicy || {};
  const meetingPoint = booking.meetingPoint || {};
  const location = content.location || {};
  const duration = categorization.duration || {};

  // Reorder photos so coverPhoto is always first (hero image)
  const displayPhotos = (() => {
    const photos = tour.photos || [];
    if (!tour.coverPhoto || photos.length === 0) return photos;
    const rest = photos.filter((p) => p !== tour.coverPhoto);
    return [tour.coverPhoto, ...rest];
  })();

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft" && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === "ArrowRight" && lightboxIndex < displayPhotos.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, displayPhotos.length]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/products")}
            className="p-2 text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8fafc] rounded-lg transition-colors mt-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">{tour.title}</h1>
              <StatusBadge status={tour.status} label={PRODUCT_STATUSES[tour.status]?.label} size="sm" />
            </div>
            <p className="text-sm text-[#64748b]">
              Created {formatDate(tour.createdAt)} &middot; Updated {formatDate(tour.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/products/build/${id}/type`)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:text-[#044b3b] hover:bg-[#f0fdf4] hover:border-[#044b3b] transition-colors"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] hover:border-[#dc3545] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </div>

      {/* Photo Gallery */}
      {displayPhotos.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayPhotos.slice(0, 4).map((photo, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`rounded-lg overflow-hidden bg-[#f8fafc] text-left ${i === 0 ? "md:row-span-2" : ""}`}
              >
                <img
                  src={photo}
                  alt={`${tour.title} - Photo ${i + 1}`}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  style={{ minHeight: i === 0 ? "300px" : "145px" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    const placeholder = document.createElement('div');
                    placeholder.className = 'flex items-center justify-center h-full min-h-[145px] text-[#9e9e9e]';
                    placeholder.textContent = '📷';
                    e.target.parentElement.appendChild(placeholder);
                  }}
                />
              </button>
            ))}
            {displayPhotos.length > 4 && (
              <button
                onClick={() => setGalleryOpen(true)}
                className="relative rounded-lg overflow-hidden min-h-[145px] cursor-pointer group w-full"
              >
                <img
                  src={displayPhotos[4]}
                  alt={`${tour.title} - Photo 5`}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                  <span className="text-sm font-medium text-[#1e293b]">+{displayPhotos.length - 4} more photos</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h2 className="text-base font-semibold text-[#1e293b] mb-3">Description</h2>
            <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{tour.description}</p>
          </div>

          {/* Highlights */}
          {content.highlights?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">Highlights</h2>
              <ul className="space-y-2">
                {content.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                    <Star size={14} className="text-[#ffc400] mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Itinerary */}
          {content.itinerary && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">Itinerary</h2>
              <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{content.itinerary}</p>
            </div>
          )}

          {/* What's Included / Excluded */}
          {(content.included?.length > 0 || content.excluded?.length > 0) && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.included?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#047857] mb-2 flex items-center gap-1.5">
                      <Check size={14} /> Included
                    </h3>
                    <ul className="space-y-1.5">
                      {content.included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                          <Check size={12} className="text-[#00d67f] mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {content.excluded?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#b91c1c] mb-2 flex items-center gap-1.5">
                      <XIcon size={14} /> Excluded
                    </h3>
                    <ul className="space-y-1.5">
                      {content.excluded.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                          <XIcon size={12} className="text-[#dc3545] mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What to Bring */}
          {content.whatToBring?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">What to Bring</h2>
              <ul className="space-y-1.5">
                {content.whatToBring.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#044b3b] mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Info */}
          {content.additionalInfo && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">Additional Information</h2>
              <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{content.additionalInfo}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Pricing Card */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Pricing</h3>
            <div className="space-y-3">
              {pricing.prices?.map((price, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">{price.ageGroup}</span>
                  <span className="font-semibold text-[#1e293b]">{formatCurrency(price.retailPrice, pricingSchedules.currency)}</span>
                </div>
              ))}
              {pricing.prices?.length === 0 && schedules.travelerDetails?.ageGroups?.length > 0 && (
                <p className="text-sm text-[#9e9e9e]">Pricing configured per age group</p>
              )}
              {pricing.prices?.length === 0 && !schedules.travelerDetails?.ageGroups && (
                <p className="text-sm text-[#9e9e9e]">No pricing data available</p>
              )}
              <div className="pt-2 border-t border-[#eaeaea]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">Currency</span>
                  <span className="font-medium text-[#1e293b]">{pricingSchedules.currency || "USD"}</span>
                </div>
                {pricing.startDate && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-[#64748b]">Valid</span>
                    <span className="font-medium text-[#1e293b]">{formatDate(pricing.startDate)} - {formatDate(pricing.endDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Details</h3>
            <div className="space-y-3">
              {categorization.category && (
                <div className="flex items-start gap-3">
                  <Globe size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Category</p>
                    <p className="text-sm text-[#1e293b] capitalize">{categorization.category}{categorization.subcategory ? ` / ${categorization.subcategory}` : ""}</p>
                  </div>
                </div>
              )}
              {(duration.hours || duration.days) && (
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Duration</p>
                    <p className="text-sm text-[#1e293b]">
                      {duration.hours ? `${duration.hours} hour${duration.hours !== 1 ? "s" : ""}` : ""}
                      {duration.days ? `${duration.days} day${duration.days !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>
              )}
              {categorization.difficulty && (
                <div className="flex items-start gap-3">
                  <Star size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Difficulty</p>
                    <p className="text-sm text-[#1e293b]">{categorization.difficulty}</p>
                  </div>
                </div>
              )}
              {categorization.transportMode && Object.keys(categorization.transportMode).length > 0 && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Transport</p>
                    <p className="text-sm text-[#1e293b]">
                      {Object.entries(categorization.transportMode).map(([mode, items]) =>
                        items?.length ? `${mode}: ${items.join(", ")}` : ""
                      ).filter(Boolean).join(" | ") || "Not specified"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Card */}
          {(location.city || location.country || tour.latitude) && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Location</h3>
              <div className="space-y-2">
                {location.city && <p className="text-sm text-[#1e293b]">{location.city}{location.country ? `, ${location.country}` : ""}</p>}
                {location.region && <p className="text-sm text-[#64748b]">{location.region}</p>}
                {tour.latitude && tour.longitude && (
                  <p className="text-xs text-[#9e9e9e]">
                    {tour.latitude}, {tour.longitude}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Schedule Card */}
          {schedules.operatingDays?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Schedule</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#9e9e9e] mb-1">Operating Days</p>
                  <div className="flex flex-wrap gap-1">
                    {schedules.operatingDays.map((day) => (
                      <span key={day} className="text-xs px-2 py-0.5 bg-[#f8fafc] rounded text-[#64748b] capitalize">
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                {schedules.timeSlots?.length > 0 && (
                  <div>
                    <p className="text-xs text-[#9e9e9e] mb-1">Time Slots</p>
                    <div className="flex flex-wrap gap-1">
                      {schedules.timeSlots.map((slot, i) => {
                        const start = typeof slot === "string" ? slot : slot.startTime;
                        const end = slot.endTime;
                        return (
                          <span key={i} className="text-xs px-2 py-0.5 bg-[#f8fafc] rounded text-[#64748b]">
                            {start}{end ? ` - ${end}` : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {schedules.capacityPerSlot && (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <Users size={14} />
                    <span>Capacity: {schedules.capacityPerSlot} per slot</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Rules Card */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Booking Rules</h3>
            <div className="space-y-2 text-sm">
              {meetingPoint.name && (
                <div>
                  <p className="text-xs text-[#9e9e9e]">Meeting Point</p>
                  <p className="text-[#1e293b]">{meetingPoint.name}</p>
                  {meetingPoint.address && <p className="text-[#64748b] text-xs">{meetingPoint.address}</p>}
                </div>
              )}
              {schedules.travelerDetails?.maxTravelersPerBooking && (
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Users size={14} />
                  <span>Max travelers: {schedules.travelerDetails.maxTravelersPerBooking}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#64748b]">
                <Check size={14} className={booking.instantBooking ? "text-[#00d67f]" : "text-[#9e9e9e]"} />
                <span>{booking.instantBooking ? "Instant booking" : "Request booking"}</span>
              </div>
              {booking.minAdvanceBookingHours && (
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Calendar size={14} />
                  <span>Book {booking.minAdvanceBookingHours}h in advance</span>
                </div>
              )}
              {cancellation.type && (
                <div className="flex items-center gap-2 text-[#64748b]">
                  <XIcon size={14} className="text-[#f97316]" />
                  <span>Cancel: {cancellation.type}{cancellation.refundPercentage ? ` (${cancellation.refundPercentage}% refund)` : ""}</span>
                </div>
              )}
              {booking.pickupAvailable && booking.pickupDetails && (
                <div>
                  <p className="text-xs text-[#9e9e9e]">Pickup</p>
                  <p className="text-[#64748b] text-xs">{booking.pickupDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* Languages */}
          {content.languages?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Languages</h3>
              <div className="flex flex-wrap gap-1">
                {content.languages.map((lang) => (
                  <span key={lang} className="flex items-center gap-1 text-xs px-2 py-1 bg-[#f8fafc] rounded text-[#64748b]">
                    <Languages size={12} />
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Card */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                <p className="text-lg font-bold text-[#044b3b]">{tour._count?.bookings ?? 0}</p>
                <p className="text-xs text-[#64748b]">Bookings</p>
              </div>
              <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                <p className="text-lg font-bold text-[#044b3b]">{tour._count?.reviews ?? 0}</p>
                <p className="text-xs text-[#64748b]">Reviews</p>
              </div>
              {tour.averageRating > 0 && (
                <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                  <p className="text-lg font-bold text-[#044b3b]">{tour.averageRating}</p>
                  <p className="text-xs text-[#64748b]">Rating</p>
                </div>
              )}
              {tour.viewCount > 0 && (
                <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                  <p className="text-lg font-bold text-[#044b3b]">{tour.viewCount}</p>
                  <p className="text-xs text-[#64748b]">Views</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1e293b]">All Photos</h2>
              <button
                onClick={() => setGalleryOpen(false)}
                className="p-1 text-[#64748b] hover:text-[#1e293b] rounded-lg hover:bg-[#f8fafc] transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {displayPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setGalleryOpen(false); setLightboxIndex(i); }}
                  className="rounded-lg overflow-hidden bg-[#f8fafc] text-left hover:opacity-90 transition-opacity"
                >
                  <img
                    src={photo}
                    alt={`${tour.title} - Photo ${i + 1}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const placeholder = document.createElement('div');
                      placeholder.className = 'flex items-center justify-center h-48 text-[#9e9e9e]';
                      placeholder.textContent = '📷';
                      e.target.parentElement.appendChild(placeholder);
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && displayPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <XIcon size={24} />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {lightboxIndex < displayPhotos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={32} />
            </button>
          )}
          <div className="max-w-5xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={displayPhotos[lightboxIndex]}
              alt={`${tour.title} - Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <p className="mt-3 text-sm text-white/70">
              {lightboxIndex + 1} / {displayPhotos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
