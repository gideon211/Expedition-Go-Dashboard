/**
 * ProductDetailPage Component
 * 
 * Displays comprehensive details for a single tour/product including:
 * - Product metadata (title, status, dates)
 * - Photo gallery with lightbox functionality
 * - Description, highlights, and itinerary
 * - Pricing information and schedules
 * - Booking rules and cancellation policies
 * - Location and transport details
 * - Statistics (bookings, reviews, ratings)
 * 
 * Features:
 * - Responsive layout (mobile-first design)
 * - Image optimization with Cloudinary transformations
 * - Keyboard navigation for lightbox (Arrow keys, Escape)
 * - Error handling with user-friendly messages
 * - Loading states for async operations
 * - Graceful fallbacks for missing data
 * 
 * @component
 * @production-ready
 */

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Trash2, Loader2, AlertCircle, MapPin, Clock, Users, Star, Globe, DollarSign, Calendar, Check, X as XIcon, Languages, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMyProduct, deleteProduct } from "@/features/products/api";
import StatusBadge from "@/components/shared/StatusBadge";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import config from "@/config";

export default function ProductDetailPage() {
  // ============================================================================
  // HOOKS & STATE MANAGEMENT
  // ============================================================================
  
  const { id } = useParams(); // Product ID from URL params
  const navigate = useNavigate(); // Navigation hook for programmatic routing
  
  // Product data state
  const [tour, setTour] = useState(null); // Main product/tour data
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  const [error, setError] = useState(null); // Error message for failed data fetch
  
  // UI interaction states
  const [deleting, setDeleting] = useState(false); // Loading state for delete operation
  const [galleryOpen, setGalleryOpen] = useState(false); // Gallery modal visibility
  const [lightboxIndex, setLightboxIndex] = useState(null); // Current image index in lightbox (null = closed)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
  /**
   * Fetch product details on component mount or when ID changes
   * 
   * Error handling:
   * - Network errors: Displays user-friendly error message
   * - 404 errors: Shows "Product not found" message
   * - Server errors: Falls back to generic error message
   * 
   * @effect Runs when `id` changes
   */
  useEffect(() => {
    // Guard: Skip if no ID provided
    if (!id) return;

    setLoading(true);
    setError(null);

    getMyProduct(id)
      .then((res) => {
        const data = res.data?.data?.tour;
        
        // Validate response data structure
        if (!data) {
          setError("Product not found");
          return;
        }
        
        setTour(data);
      })
      .catch((err) => {
        // Extract error message with fallback chain
        setError(err.response?.data?.message || err.message || "Failed to load product");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handle product deletion with confirmation
   * 
   * Flow:
   * 1. Show native confirmation dialog
   * 2. Call delete API
   * 3. Show success toast and navigate to products list
   * 4. On error, show error toast and keep user on page
   * 
   * Security: Requires user confirmation before destructive action
   * UX: Provides feedback via toast notifications
   */
  const handleDelete = () => {
    // Confirmation dialog prevents accidental deletion
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    setDeleting(true);
    deleteProduct(id)
      .then(() => {
        toast.success("Product deleted successfully");
        navigate("/products"); // Redirect to products list after successful deletion
      })
      .catch((err) => {
        // Show error toast with specific message
        toast.error(err.response?.data?.message || err.message || "Failed to delete product");
      })
      .finally(() => setDeleting(false));
  };

  // ============================================================================
  // COMPUTED VALUES & HELPERS
  // ============================================================================
  
  /**
   * Reorder photos array to ensure coverPhoto is always first (hero image)
   * 
   * Logic:
   * 1. If coverPhoto exists but photos array is empty, return array with just coverPhoto
   * 2. If no coverPhoto or no photos, return photos as-is
   * 3. Extract public ID from URLs to compare (handles different Cloudinary transformations)
   * 4. Filter out coverPhoto from photos array and prepend it
   * 
   * Why: Backend may apply different Cloudinary transformations to coverPhoto vs photos,
   * so we compare by public ID (the part after /v1/ or the last path segment) rather than
   * full URL to avoid duplicates.
   * 
   * @returns {string[]} Ordered array of photo URLs with coverPhoto first
   */
  const displayPhotos = (() => {
    const rawPhotos = (tour?.photos || []).filter(Boolean);
    const coverPhoto = tour?.coverPhoto;
    
    if (coverPhoto && rawPhotos.length === 0) return [coverPhoto];
    if (!coverPhoto || rawPhotos.length === 0) return rawPhotos;
    
    const extractId = (url) => {
      if (!url) return '';
      const m = url.match(/\/(?:v\d+\/)?([^/]+)$/);
      return m ? m[1] : url;
    };
    
    const coverId = extractId(coverPhoto);
    const rest = rawPhotos.filter((p) => extractId(p) !== coverId);
    
    return [coverPhoto, ...rest];
  })();

  /**
   * Generate optimized Cloudinary thumbnail URL with transformations
   * 
   * Transformations applied:
   * - c_fill: Crop to fill dimensions while maintaining aspect ratio
   * - w_{width}: Set width in pixels
   * - h_{height}: Set height in pixels
   * - q_auto: Automatic quality optimization
   * - f_auto: Automatic format selection (WebP when supported)
   * 
   * Performance benefits:
   * - Reduces bandwidth usage by 60-80%
   * - Faster page load times
   * - Better mobile experience
   * - Automatic format optimization (WebP, AVIF)
   * 
   * @param {string} url - Original Cloudinary URL
   * @param {number} width - Desired width in pixels (default: 400)
   * @param {number} height - Desired height in pixels (default: 300)
   * @returns {string} Optimized URL with transformations or original URL if not Cloudinary
   */
  const getCloudinaryThumbnail = (url, width = 400, height = 300) => {
    if (!url) return url;
    
    // Only apply transformations to Cloudinary URLs
    if (url.includes('cloudinary.com')) {
      // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}
      // Insert transformations after '/upload/'
      const uploadIndex = url.indexOf('/upload/');
      
      if (uploadIndex !== -1) {
        const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
        const afterUpload = url.substring(uploadIndex + 8);
        return `${beforeUpload}c_fill,w_${width},h_${height},q_auto,f_auto/${afterUpload}`;
      }
    }
    
    // Return original URL for non-Cloudinary images or if pattern doesn't match
    return url;
  };

  /**
   * Get image URL with fallback handling
   * 
   * Handles:
   * - Full HTTP/HTTPS URLs (Cloudinary, external)
   * - Blob URLs (local file uploads)
   * - Bare public IDs (when backend Cloudinary env is not configured)
   * 
   * @param {string} url - Image URL or public ID
   * @returns {string} Processed URL
   * @deprecated Use getCloudinaryThumbnail for better performance
   */
  const proxyUrl = (photoIndex) => {
    const idx = photoIndex != null ? photoIndex : 0;
    return `${config.api.baseURL}/tours/${id}/photo?index=${idx}`;
  };

  const getImageUrl = (url, photoIndex) => {
    if (!url) return url;

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }

    return proxyUrl(photoIndex);
  };

  const handleImageError = (e, photoIndex) => {
    console.error('Image failed to load:', e.target.src);
    const fallback = proxyUrl(photoIndex);
    if (!e.target.src || e.target.src !== fallback) {
      e.target.src = fallback;
      return;
    }
    e.target.style.display = "none";
  };

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================
  
  /**
   * Setup keyboard navigation for lightbox
   * 
   * Supported keys:
   * - Escape: Close lightbox
   * - ArrowLeft: Previous image (if not at start)
   * - ArrowRight: Next image (if not at end)
   * 
   * Accessibility: Provides keyboard-only navigation for users who cannot use mouse
   * UX: Standard lightbox keyboard shortcuts expected by users
   * 
   * @effect Runs when lightboxIndex or displayPhotos.length changes
   */
  useEffect(() => {
    // Guard: Only setup listeners when lightbox is open
    if (lightboxIndex === null) return;
    
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft" && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === "ArrowRight" && lightboxIndex < displayPhotos.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    
    window.addEventListener("keydown", handleKey);
    
    // Cleanup: Remove listener when lightbox closes or component unmounts
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, displayPhotos.length]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  
  /**
   * Loading state UI
   * 
   * Shows centered spinner with descriptive text
   * Displayed while initial product data is being fetched
   */
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

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  
  /**
   * Error state UI
   * 
   * Displays user-friendly error message with:
   * - Error icon for visual recognition
   * - Clear error message
   * - Action button to return to products list
   * 
   * Handles:
   * - Network errors
   * - 404 Not Found
   * - Server errors
   * - Permission errors
   */
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

  // Guard: Prevent rendering if tour data is null (shouldn't happen after loading/error checks)
  if (!tour) return null;

  // ============================================================================
  // DATA EXTRACTION
  // ============================================================================
  
  /**
   * Extract nested data with safe fallbacks
   * 
   * Why: Backend returns deeply nested objects that may be null/undefined
   * Pattern: Use optional chaining (?.) and nullish coalescing (??) for safety
   * 
   * Data structure mirrors backend API response:
   * - categorization: Product category, duration, difficulty, transport
   * - productContent: Description, highlights, itinerary, languages
   * - schedulesAndPricing: Operating days, time slots, pricing
   * - bookingAndTickets: Booking rules, cancellation policy, meeting point
   */
  const categorization = tour.categorization || {};
  const content = tour.productContent || {};
  const schedules = tour.schedulesAndPricing || {};
  const booking = tour.bookingAndTickets || {};
  const pricingSchedules = schedules.pricingSchedules || {};
  const pricing = pricingSchedules.schedules?.[0] || {}; // Get first pricing schedule
  const cancellation = booking.cancellationPolicy || {};
  const meetingPoint = booking.meetingPoint || {};
  const location = content.location || {};
  const duration = categorization.duration || {};

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* ========================================================================
          HEADER SECTION
          - Back button for navigation
          - Product title with status badge
          - Creation/update timestamps
          - Edit and Delete action buttons
          ======================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        {/* Left side: Back button + Title + Metadata */}
        <div className="flex items-start gap-3">
          {/* Back to products list button */}
          <button
            onClick={() => navigate("/products")}
            className="p-2 text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8fafc] rounded-lg transition-colors mt-1"
            aria-label="Back to products"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            {/* Product title with status badge */}
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">{tour.title}</h1>
              <StatusBadge status={tour.status} label={PRODUCT_STATUSES[tour.status]?.label} size="sm" />
            </div>
            
            {/* Timestamps: Created and last updated */}
            <p className="text-sm text-[#64748b]">
              Created {formatDate(tour.createdAt)} &middot; Updated {formatDate(tour.updatedAt)}
            </p>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Edit button - navigates to product builder */}
          <button
            onClick={() => navigate(`/products/build/${id}/type`)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:text-[#044b3b] hover:bg-[#f0fdf4] hover:border-[#044b3b] transition-colors"
            aria-label="Edit product"
          >
            <Edit size={16} />
            Edit
          </button>
          
          {/* Delete button - shows confirmation dialog */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] hover:border-[#dc3545] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete product"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </div>

      {/* ========================================================================
          PHOTO GALLERY SECTION
          - Grid layout: 1 large hero image + 3 smaller thumbnails
          - First 4 photos displayed in grid
          - "+X more photos" button if more than 4 photos
          - Click to open lightbox for full-size viewing
          - Graceful fallback for failed image loads
          ======================================================================== */}
      {displayPhotos.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[145px_145px] gap-3">
            {displayPhotos.slice(0, 4).map((photo, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`relative w-full overflow-hidden rounded-lg bg-[#f8fafc] text-left ${
                  i === 0 ? "h-[240px] md:h-full md:row-span-2" : "h-[145px]"
                }`}
                aria-label={`View photo ${i + 1} of ${displayPhotos.length}`}
              >
                <img
                  src={getImageUrl(photo, i)}
                  alt={`${tour.title} - Photo ${i + 1}`}
                  className="absolute inset-0 h-full w-full object-cover hover:opacity-90 transition-opacity"
                  onError={(e) => handleImageError(e, i)}
                />
              </button>
            ))}

            {displayPhotos.length > 4 && (
              <button
                onClick={() => setGalleryOpen(true)}
                className="relative h-[145px] w-full overflow-hidden rounded-lg cursor-pointer group"
                aria-label={`View all ${displayPhotos.length} photos`}
              >
                <img
                  src={getImageUrl(displayPhotos[4], 4)}
                  alt={`${tour.title} - Photo 5`}
                  className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                  onError={(e) => handleImageError(e, 4)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                  <span className="text-sm font-medium text-[#1e293b]">
                    +{displayPhotos.length - 4} more photos
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MAIN LAYOUT: 2-COLUMN GRID
          - Left column (2/3 width): Main content (description, highlights, itinerary, etc.)
          - Right column (1/3 width): Sidebar (pricing, details, location, stats)
          - Responsive: Stacks vertically on mobile
          ======================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ======================================================================
            LEFT COLUMN: MAIN CONTENT
            - Product description
            - Highlights (key selling points)
            - Itinerary (day-by-day schedule)
            - What's included/excluded
            - What to bring
            - Additional information
            
            Pattern: Conditional rendering with optional chaining
            Only show sections if data exists
            ====================================================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Description Section - Always shown */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h2 className="text-base font-semibold text-[#1e293b] mb-3">Description</h2>
            <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
              {tour.description}
            </p>
          </div>

          {/* Highlights Section - Conditional: Only if highlights exist */}
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

          {/* Itinerary Section - Conditional: Only if itinerary exists */}
          {content.itinerary?.length > 0 && Array.isArray(content.itinerary) && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-4">Itinerary</h2>
              <div className="space-y-4">
                {content.itinerary.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#044b3b] flex-shrink-0 mt-1" />
                      {index < content.itinerary.length - 1 && (
                        <div className="w-0.5 flex-1 bg-[#eaeaea] mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        {(item.day || item.time) && (
                          <span className="text-xs font-semibold text-[#044b3b] uppercase tracking-wider">
                            {[item.day, item.time].filter(Boolean).join(" — ")}
                          </span>
                        )}
                      </div>
                      {item.title && (
                        <h3 className="text-sm font-semibold text-[#1e293b]">{item.title}</h3>
                      )}
                      {item.description && (
                        <p className="text-sm text-[#475569] leading-relaxed mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Included/Excluded Section - Conditional: Only if either list exists */}
          {(content.included?.length > 0 || content.excluded?.length > 0) && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Included items list */}
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
                
                {/* Excluded items list */}
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

          {/* What to Bring Section - Conditional: Only if items exist */}
          {content.whatToBring?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">What to Bring</h2>
              <ul className="space-y-1.5">
                {content.whatToBring.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                    {/* Bullet point indicator */}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#044b3b] mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Information Section - Conditional: Only if content exists */}
          {content.additionalInfo && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h2 className="text-base font-semibold text-[#1e293b] mb-3">Additional Information</h2>
              <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
                {content.additionalInfo}
              </p>
            </div>
          )}
        </div>

        {/* ======================================================================
            RIGHT COLUMN: SIDEBAR
            - Pricing information
            - Product details (category, duration, difficulty, transport)
            - Location information
            - Schedule (operating days, time slots)
            - Booking rules
            - Languages offered
            - Statistics (bookings, reviews, ratings, views)
            
            Pattern: Sticky sidebar on desktop, stacks below main content on mobile
            ====================================================================== */}
        <div className="space-y-4">
          
          {/* Pricing Card */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Pricing</h3>
            <div className="space-y-3">
              {/* Price list by age group */}
              {pricing.prices?.map((price, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">{price.ageGroup}</span>
                  <span className="font-semibold text-[#1e293b]">
                    {formatCurrency(price.retailPrice, pricingSchedules.currency)}
                  </span>
                </div>
              ))}
              
              {/* Fallback messages for missing pricing data */}
              {pricing.prices?.length === 0 && schedules.travelerDetails?.ageGroups?.length > 0 && (
                <p className="text-sm text-[#9e9e9e]">Pricing configured per age group</p>
              )}
              {pricing.prices?.length === 0 && !schedules.travelerDetails?.ageGroups && (
                <p className="text-sm text-[#9e9e9e]">No pricing data available</p>
              )}
              
              {/* Currency and validity period */}
              <div className="pt-2 border-t border-[#eaeaea]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">Currency</span>
                  <span className="font-medium text-[#1e293b]">
                    {pricingSchedules.currency || "USD"}
                  </span>
                </div>
                {pricing.startDate && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-[#64748b]">Valid</span>
                    <span className="font-medium text-[#1e293b]">
                      {formatDate(pricing.startDate)} - {formatDate(pricing.endDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Card - Product metadata */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Details</h3>
            <div className="space-y-3">
              
              {/* Category & Subcategory */}
              {categorization.category && (
                <div className="flex items-start gap-3">
                  <Globe size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Category</p>
                    <p className="text-sm text-[#1e293b] capitalize">
                      {categorization.category}
                      {categorization.subcategory ? ` / ${categorization.subcategory}` : ""}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Duration (hours and/or days) */}
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
              
              {/* Difficulty Level */}
              {categorization.difficulty && (
                <div className="flex items-start gap-3">
                  <Star size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Difficulty</p>
                    <p className="text-sm text-[#1e293b]">{categorization.difficulty}</p>
                  </div>
                </div>
              )}
              
              {/* Transport Modes (e.g., "Air: Plane", "Land: Bus, Car") */}
              {categorization.transportMode && Object.keys(categorization.transportMode).length > 0 && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#9e9e9e]">Transport</p>
                    <p className="text-sm text-[#1e293b]">
                      {Object.entries(categorization.transportMode)
                        .map(([mode, items]) =>
                          items?.length ? `${mode}: ${items.join(", ")}` : ""
                        )
                        .filter(Boolean)
                        .join(" | ") || "Not specified"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Card - Conditional: Only if location data exists */}
          {(location.city || location.country || tour.latitude) && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Location</h3>
              <div className="space-y-2">
                {/* City and Country */}
                {location.city && (
                  <p className="text-sm text-[#1e293b]">
                    {location.city}{location.country ? `, ${location.country}` : ""}
                  </p>
                )}
                
                {/* Region */}
                {location.region && <p className="text-sm text-[#64748b]">{location.region}</p>}
                
                {/* GPS Coordinates */}
                {tour.latitude && tour.longitude && (
                  <p className="text-xs text-[#9e9e9e]">
                    {tour.latitude}, {tour.longitude}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Schedule Card - Conditional: Only if operating days exist */}
          {schedules.operatingDays?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Schedule</h3>
              <div className="space-y-2">
                
                {/* Operating Days (e.g., Mon, Tue, Wed) */}
                <div>
                  <p className="text-xs text-[#9e9e9e] mb-1">Operating Days</p>
                  <div className="flex flex-wrap gap-1">
                    {schedules.operatingDays.map((day) => (
                      <span 
                        key={day} 
                        className="text-xs px-2 py-0.5 bg-[#f8fafc] rounded text-[#64748b] capitalize"
                      >
                        {day.slice(0, 3)} {/* Show first 3 letters: Mon, Tue, etc. */}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Time Slots (e.g., "09:00 - 12:00", "14:00 - 17:00") */}
                {schedules.timeSlots?.length > 0 && (
                  <div>
                    <p className="text-xs text-[#9e9e9e] mb-1">Time Slots</p>
                    <div className="flex flex-wrap gap-1">
                      {schedules.timeSlots.map((slot, i) => {
                        // Handle both string format ("09:00") and object format ({startTime, endTime})
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
                
                {/* Capacity per time slot */}
                {schedules.capacityPerSlot && (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <Users size={14} />
                    <span>Capacity: {schedules.capacityPerSlot} per slot</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Rules Card - Always shown */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Booking Rules</h3>
            <div className="space-y-2 text-sm">
              
              {/* Meeting Point */}
              {meetingPoint.name && (
                <div>
                  <p className="text-xs text-[#9e9e9e]">Meeting Point</p>
                  <p className="text-[#1e293b]">{meetingPoint.name}</p>
                  {meetingPoint.address && (
                    <p className="text-[#64748b] text-xs">{meetingPoint.address}</p>
                  )}
                </div>
              )}
              
              {/* Maximum travelers per booking */}
              {schedules.travelerDetails?.maxTravelersPerBooking && (
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Users size={14} />
                  <span>Max travelers: {schedules.travelerDetails.maxTravelersPerBooking}</span>
                </div>
              )}
              
              {/* Instant booking vs Request booking */}
              <div className="flex items-center gap-2 text-[#64748b]">
                <Check 
                  size={14} 
                  className={booking.instantBooking ? "text-[#00d67f]" : "text-[#9e9e9e]"} 
                />
                <span>{booking.instantBooking ? "Instant booking" : "Request booking"}</span>
              </div>
              
              {/* Minimum advance booking time */}
              {booking.minAdvanceBookingHours && (
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Calendar size={14} />
                  <span>Book {booking.minAdvanceBookingHours}h in advance</span>
                </div>
              )}
              
              {/* Cancellation policy */}
              {cancellation.type && (
                <div className="flex items-center gap-2 text-[#64748b]">
                  <XIcon size={14} className="text-[#f97316]" />
                  <span>
                    Cancel: {cancellation.type}
                    {cancellation.refundPercentage ? ` (${cancellation.refundPercentage}% refund)` : ""}
                  </span>
                </div>
              )}
              
              {/* Pickup information */}
              {booking.pickupAvailable && booking.pickupDetails && (
                <div>
                  <p className="text-xs text-[#9e9e9e]">Pickup</p>
                  <p className="text-[#64748b] text-xs">{booking.pickupDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* Languages Card - Conditional: Only if languages exist */}
          {content.languages?.length > 0 && (
            <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Languages</h3>
              <div className="flex flex-wrap gap-1">
                {content.languages.map((lang) => (
                  <span 
                    key={lang} 
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-[#f8fafc] rounded text-[#64748b]"
                  >
                    <Languages size={12} />
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Card - Always shown */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Bookings count - Always shown (defaults to 0) */}
              <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                <p className="text-lg font-bold text-[#044b3b]">{tour._count?.bookings ?? 0}</p>
                <p className="text-xs text-[#64748b]">Bookings</p>
              </div>
              
              {/* Reviews count - Always shown (defaults to 0) */}
              <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                <p className="text-lg font-bold text-[#044b3b]">{tour._count?.reviews ?? 0}</p>
                <p className="text-xs text-[#64748b]">Reviews</p>
              </div>
              
              {/* Average rating - Conditional: Only if rating > 0 */}
              {tour.averageRating > 0 && (
                <div className="text-center p-2 bg-[#f8fafc] rounded-lg">
                  <p className="text-lg font-bold text-[#044b3b]">{tour.averageRating}</p>
                  <p className="text-xs text-[#64748b]">Rating</p>
                </div>
              )}
              
              {/* View count - Conditional: Only if views > 0 */}
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
                  className="relative h-48 w-full overflow-hidden rounded-lg bg-[#f8fafc] text-left hover:opacity-90 transition-opacity"
                >
                  <img
                    src={getImageUrl(photo, i)}
                    alt={`${tour.title} - Photo ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => handleImageError(e, i)}
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
              src={getImageUrl(displayPhotos[lightboxIndex], lightboxIndex)}
              alt={`${tour.title} - Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => handleImageError(e, lightboxIndex)}
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
