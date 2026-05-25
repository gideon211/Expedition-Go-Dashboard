function cloudinaryUrl(url, width = 800) {
  if (typeof url !== 'string') return url;

  const { CLOUDINARY_CLOUD_NAME } = process.env;

  // If it's a public ID (not a full URL), construct the full Cloudinary URL
  if (CLOUDINARY_CLOUD_NAME && !url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_auto,f_auto/v1/${url}`;
  }

  // Only process Cloudinary URLs
  const isCloudinary = url.includes('cloudinary.com') && url.includes('/upload/');
  if (!isCloudinary) return url;

  // Extract the segment immediately after /upload/ (e.g. "v123" or "w_800,q_auto")
  const uploadMatch = url.match(/\/upload\/([^/]+)\//);
  if (!uploadMatch) return url;

  const segment = uploadMatch[1];

  // If segment is just a version number (v123), no transformations yet — inject them
  if (/^v\d+/.test(segment)) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }

  // Already has transformations (w_, c_, q_, etc.) — replace width only
  if (/w_\d+/.test(url)) {
    return url.replace(/w_\d+/, `w_${width}`);
  }

  // Has other transformations but no width — prepend width
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}

module.exports = { cloudinaryUrl };