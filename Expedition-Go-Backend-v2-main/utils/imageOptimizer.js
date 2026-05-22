function cloudinaryUrl(url, width = 800) {
  if (typeof url !== 'string') return url;

  const { CLOUDINARY_CLOUD_NAME } = process.env;

  // If it's a public ID (not a full URL), construct the full Cloudinary URL
  if (CLOUDINARY_CLOUD_NAME && !url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_auto,f_auto/v1/${url}`;
  }

  // Already a full URL with /upload/ — inject transformation parameters
  return url.replace(
    '/upload/',
    `/upload/w_${width},q_auto,f_auto/`
  );
}

module.exports = { cloudinaryUrl };