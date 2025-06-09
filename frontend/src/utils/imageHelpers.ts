// Giúp xây dựng URL ảnh sản phẩm một cách nhất quán
const FALLBACK_IMAGE = '/assets/images/product-placeholder.jpg';

export const getProductImageUrl = (productId?: string | number) => {
  console.log('Getting image URL for product ID:', productId);
  
  if (!productId) {
    console.log('No product ID provided, using fallback');
    return FALLBACK_IMAGE;
  }
  
  try {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    console.log('Base URL:', baseUrl);
    
    // Tạo URL một cách an toàn
    let imageUrl;
    if (baseUrl.endsWith('/')) {
      imageUrl = `${baseUrl}products/images/product/${productId}`;
    } else {
      imageUrl = `${baseUrl}/products/images/product/${productId}`;
    }
    
    // Thêm timestamp để tránh cache
    const url = new URL(imageUrl);
    url.searchParams.append('t', Date.now().toString());
    
    const finalUrl = url.toString();
    console.log('Generated image URL:', finalUrl);
    
    return finalUrl;
  } catch (error) {
    console.error('Error creating product image URL:', error);
    return FALLBACK_IMAGE;
  }
};

// Hàm kiểm tra xem ảnh có tồn tại không
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
};

// Hàm tạo URL ảnh với kiểm tra
export const getValidProductImageUrl = async (productId?: string | number): Promise<string> => {
  if (!productId) return FALLBACK_IMAGE;
  
  const imageUrl = getProductImageUrl(productId);
  const exists = await checkImageExists(imageUrl);
  
  return exists ? imageUrl : FALLBACK_IMAGE;
};

export { FALLBACK_IMAGE };